BEGIN;

DROP POLICY IF EXISTS "shop members can delete notifications" ON public.shop_notifications;

CREATE POLICY "only owners can delete notifications"
  ON public.shop_notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.shop_notifications.shop_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

COMMIT;
