export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Views: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
    Tables: {
      shops: {
        Row: { id: string; name: string; address: string | null; created_at: string };
        Insert: { id?: string; name: string; address?: string | null; created_at?: string };
        Update: { id?: string; name?: string; address?: string | null; created_at?: string };
        Relationships: [];
      };
      shop_members: {
        Row: { id: string; shop_id: string; user_id: string; role: "owner" | "staff"; created_at: string };
        Insert: { id?: string; shop_id: string; user_id: string; role?: "owner" | "staff"; created_at?: string };
        Update: { id?: string; shop_id?: string; user_id?: string; role?: "owner" | "staff"; created_at?: string };
        Relationships: [
          { foreignKeyName: "shop_members_shop_id_fkey"; columns: ["shop_id"]; isOneToOne: false; referencedRelation: "shops"; referencedColumns: ["id"] },
        ];
      };
      categories: {
        Row: { id: string; shop_id: string; name: string; color: string; created_at: string };
        Insert: { id?: string; shop_id: string; name: string; color?: string; created_at?: string };
        Update: { id?: string; shop_id?: string; name?: string; color?: string; created_at?: string };
        Relationships: [];
      };
      rooms: {
        Row: { id: string; shop_id: string; name: string; created_at: string };
        Insert: { id?: string; shop_id: string; name: string; created_at?: string };
        Update: { id?: string; shop_id?: string; name?: string; created_at?: string };
        Relationships: [];
      };
      profiles: {
        Row: { id: string; shop_id: string | null; full_name: string; role: "owner" | "staff"; created_at: string };
        Insert: { id: string; shop_id?: string | null; full_name: string; role?: "owner" | "staff"; created_at?: string };
        Update: { id?: string; shop_id?: string | null; full_name?: string; role?: "owner" | "staff"; created_at?: string };
        Relationships: [];
      };
      products: {
        Row: { id: string; shop_id: string; room_id: string; name: string; sku: string; category: string; quantity: number; min_stock: number; price: number; size: string | null; updated_at: string };
        Insert: { id?: string; shop_id: string; room_id: string; name: string; sku: string; category: string; quantity?: number; min_stock?: number; price: number; size?: string | null; updated_at?: string };
        Update: { id?: string; shop_id?: string; room_id?: string; name?: string; sku?: string; category?: string; quantity?: number; min_stock?: number; price?: number; size?: string | null; updated_at?: string };
        Relationships: [];
      };
      sales: {
        Row: { id: string; shop_id: string; user_id: string; total_amount: number; synced: boolean; created_at: string };
        Insert: { id?: string; shop_id: string; user_id: string; total_amount: number; synced?: boolean; created_at?: string };
        Update: { id?: string; shop_id?: string; user_id?: string; total_amount?: number; synced?: boolean; created_at?: string };
        Relationships: [];
      };
      sale_items: {
        Row: { id: string; sale_id: string; product_id: string; quantity: number; unit_price: number };
        Insert: { id?: string; sale_id: string; product_id: string; quantity: number; unit_price: number };
        Update: { id?: string; sale_id?: string; product_id?: string; quantity?: number; unit_price?: number };
        Relationships: [];
      };
      stock_movements: {
        Row: { id: string; shop_id: string; product_id: string; type: "IN" | "OUT"; delta: number; snapshot_qty: number; seq: number; device_id: string; reason: "sale" | "restock" | "adjustment"; user_id: string; synced: boolean; conflict_flag: boolean; created_at: string };
        Insert: { id?: string; shop_id: string; product_id: string; type: "IN" | "OUT"; delta: number; snapshot_qty: number; seq?: number; device_id: string; reason: "sale" | "restock" | "adjustment"; user_id: string; synced?: boolean; conflict_flag?: boolean; created_at?: string };
        Update: { id?: string; shop_id?: string; product_id?: string; type?: "IN" | "OUT"; delta?: number; snapshot_qty?: number; seq?: number; device_id?: string; reason?: "sale" | "restock" | "adjustment"; user_id?: string; synced?: boolean; conflict_flag?: boolean; created_at?: string };
        Relationships: [];
      };
      sync_queue: {
        Row: { id: string; shop_id: string; table_name: string; operation: "INSERT" | "UPDATE" | "DELETE"; payload: Json; status: "pending" | "synced" | "failed"; error: string | null; attempts: number; created_at: string };
        Insert: { id?: string; shop_id: string; table_name: string; operation: "INSERT" | "UPDATE" | "DELETE"; payload: Json; status?: "pending" | "synced" | "failed"; error?: string | null; attempts?: number; created_at?: string };
        Update: { id?: string; shop_id?: string; table_name?: string; operation?: "INSERT" | "UPDATE" | "DELETE"; payload?: Json; status?: "pending" | "synced" | "failed"; error?: string | null; attempts?: number; created_at?: string };
        Relationships: [];
      };
      purchase_orders: {
        Row: { id: string; shop_id: string; supplier_name: string; status: "draft" | "received" | "partial"; received_by: string | null; received_at: string | null; synced: boolean; created_at: string };
        Insert: { id?: string; shop_id: string; supplier_name: string; status?: "draft" | "received" | "partial"; received_by?: string | null; received_at?: string | null; synced?: boolean; created_at?: string };
        Update: { id?: string; shop_id?: string; supplier_name?: string; status?: "draft" | "received" | "partial"; received_by?: string | null; received_at?: string | null; synced?: boolean; created_at?: string };
        Relationships: [];
      };
      po_items: {
        Row: { id: string; po_id: string; product_id: string; qty_expected: number; qty_received: number; unit_cost: number };
        Insert: { id?: string; po_id: string; product_id: string; qty_expected: number; qty_received?: number; unit_cost: number };
        Update: { id?: string; po_id?: string; product_id?: string; qty_expected?: number; qty_received?: number; unit_cost?: number };
        Relationships: [];
      };
    };
    Functions: {
      setup_owner_shop: {
        Args: { p_user_id: string; p_shop_name: string; p_shop_address: string | null; p_full_name: string };
        Returns: string;
      };
      seed_default_categories: {
        Args: { p_shop_id: string };
        Returns: undefined;
      };
      apply_stock_deltas: {
        Args: { p_product_id: string };
        Returns: undefined;
      };
      record_sale: {
        Args: { p_sale: Json; p_items: Json };
        Returns: string;
      };
      get_low_stock_products: {
        Args: { p_shop_id: string };
        Returns: { id: string; name: string; sku: string; quantity: number; min_stock: number; room_id: string; category: string }[];
      };
      get_sales_summary: {
        Args: { p_shop_id: string; p_from: string; p_to: string };
        Returns: { date: string; total_revenue: number; order_count: number }[];
      };
      get_shop_team: {
        Args: { p_shop_id: string };
        Returns: { user_id: string; full_name: string; role: string; joined_at: string }[];
      };
      remove_staff_member: {
        Args: { p_shop_id: string; p_user_id: string };
        Returns: undefined;
      };
      auth_shop_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      auth_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      auth_shop_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      auth_role_in_shop: {
        Args: { p_shop_id: string };
        Returns: string;
      };
      switch_active_shop: {
        Args: { p_shop_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: "owner" | "staff";
      product_category: "tire" | "battery" | "rim";
      movement_type: "IN" | "OUT";
      movement_reason: "sale" | "restock" | "adjustment";
      po_status: "draft" | "received" | "partial";
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];