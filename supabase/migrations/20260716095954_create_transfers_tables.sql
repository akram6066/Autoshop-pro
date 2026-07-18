-- Create the transfer status enum
CREATE TYPE transfer_status AS ENUM ('draft', 'in_transit', 'completed', 'cancelled');

-- 1. Create `transfers` table
CREATE TABLE public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  dest_shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status transfer_status NOT NULL DEFAULT 'draft',
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for transfers
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Transfers RLS Policies:
-- Users can SELECT transfers if they belong to either the source or destination shop
CREATE POLICY "transfers_select_policy" ON public.transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members 
      WHERE shop_id = public.transfers.source_shop_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.shop_members 
      WHERE shop_id = public.transfers.dest_shop_id AND user_id = auth.uid()
    )
  );

-- Only owners/staff of the SOURCE shop can CREATE/UPDATE transfers that are outbound
CREATE POLICY "transfers_insert_policy" ON public.transfers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_members 
      WHERE shop_id = public.transfers.source_shop_id AND user_id = auth.uid()
    )
  );

-- Updates allowed if you belong to source or dest shop (e.g. source marks 'in_transit', dest marks 'completed')
CREATE POLICY "transfers_update_policy" ON public.transfers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shop_members 
      WHERE (shop_id = public.transfers.source_shop_id OR shop_id = public.transfers.dest_shop_id) 
      AND user_id = auth.uid()
    )
  );

-- Only source shop owner/staff can DELETE a draft transfer
CREATE POLICY "transfers_delete_policy" ON public.transfers
  FOR DELETE USING (
    status = 'draft' AND 
    EXISTS (
      SELECT 1 FROM public.shop_members 
      WHERE shop_id = public.transfers.source_shop_id AND user_id = auth.uid()
    )
  );

-- 2. Create `transfer_items` table
CREATE TABLE public.transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- Enable RLS for transfer_items
ALTER TABLE public.transfer_items ENABLE ROW LEVEL SECURITY;

-- Transfer Items RLS: Inherit access from parent transfer
CREATE POLICY "transfer_items_select" ON public.transfer_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = public.transfer_items.transfer_id
      AND (
        EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = t.source_shop_id AND user_id = auth.uid())
        OR 
        EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = t.dest_shop_id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "transfer_items_insert" ON public.transfer_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = public.transfer_items.transfer_id
      AND EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = t.source_shop_id AND user_id = auth.uid())
    )
  );

CREATE POLICY "transfer_items_update" ON public.transfer_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = public.transfer_items.transfer_id
      AND EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = t.source_shop_id AND user_id = auth.uid())
    )
  );

CREATE POLICY "transfer_items_delete" ON public.transfer_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = public.transfer_items.transfer_id
      AND EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = t.source_shop_id AND user_id = auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX idx_transfers_source_shop ON public.transfers(source_shop_id);
CREATE INDEX idx_transfers_dest_shop ON public.transfers(dest_shop_id);
CREATE INDEX idx_transfers_status ON public.transfers(status);
CREATE INDEX idx_transfer_items_transfer_id ON public.transfer_items(transfer_id);

-- Update timestamp trigger for transfers
CREATE TRIGGER set_timestamp_transfers
BEFORE UPDATE ON public.transfers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
