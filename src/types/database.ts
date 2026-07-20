export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Views: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
    Tables: {
      shops: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          created_at: string;
          plan: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          created_at?: string;
          plan?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          created_at?: string;
          plan?: string;
        };
        Relationships: [];
      };
      shop_members: {
        Row: {
          id: string;
          shop_id: string;
          user_id: string;
          role: "owner" | "staff";
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          user_id: string;
          role?: "owner" | "staff";
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          user_id?: string;
          role?: "owner" | "staff";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: { id: string; shop_id: string; name: string; created_at: string };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      shop_invites: {
        Row: {
          id: string;
          shop_id: string;
          email: string;
          role: "owner" | "staff";
          status: "pending" | "accepted" | "rejected";
          invited_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          email: string;
          role: "owner" | "staff";
          status?: "pending" | "accepted" | "rejected";
          invited_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          email?: string;
          role?: "owner" | "staff";
          status?: "pending" | "accepted" | "rejected";
          invited_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shop_invites_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          shop_id: string | null;
          user_id: string | null;
          event_type: string;
          entity_type: string;
          entity_id: string;
          payload: Json;
          severity: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id?: string | null;
          user_id?: string | null;
          event_type: string;
          entity_type: string;
          entity_id: string;
          payload?: Json;
          severity?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string | null;
          user_id?: string | null;
          event_type?: string;
          entity_type?: string;
          entity_id?: string;
          payload?: Json;
          severity?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      system_health: {
        Row: {
          id: string;
          component: string;
          status: string;
          latency_ms: number | null;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          component: string;
          status: string;
          latency_ms?: number | null;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          component?: string;
          status?: string;
          latency_ms?: number | null;
          message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          shop_id: string | null;
          full_name: string;
          role: "owner" | "staff";
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          shop_id?: string | null;
          full_name: string;
          role?: "owner" | "staff";
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string | null;
          full_name?: string;
          role?: "owner" | "staff";
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          room_id: string;
          name: string;
          sku: string;
          category: string;
          quantity: number;
          min_stock: number;
          price: number;
          size: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          room_id: string;
          name: string;
          sku: string;
          category: string;
          quantity?: number;
          min_stock?: number;
          price: number;
          size?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          room_id?: string;
          name?: string;
          sku?: string;
          category?: string;
          quantity?: number;
          min_stock?: number;
          price?: number;
          size?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          phone: string | null;
          balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          phone?: string | null;
          balance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          phone?: string | null;
          balance?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      customer_payments: {
        Row: {
          id: string;
          shop_id: string;
          customer_id: string;
          amount: number;
          note: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          customer_id: string;
          amount: number;
          note?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          customer_id?: string;
          amount?: number;
          note?: string | null;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          shop_id: string;
          user_id: string;
          total_amount: number;
          payment_method: string;
          delivery_address: string | null;
          customer_id: string | null;
          amount_paid: number;
          synced: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          user_id: string;
          total_amount: number;
          payment_method?: string;
          delivery_address?: string | null;
          customer_id?: string | null;
          amount_paid?: number;
          synced?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          user_id?: string;
          total_amount?: number;
          payment_method?: string;
          delivery_address?: string | null;
          customer_id?: string | null;
          amount_paid?: number;
          synced?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          original_price: number | null;
          override_reason: string | null;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          original_price?: number | null;
          override_reason?: string | null;
        };
        Update: {
          id?: string;
          sale_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          original_price?: number | null;
          override_reason?: string | null;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          shop_id: string;
          product_id: string;
          type: "IN" | "OUT";
          delta: number;
          snapshot_qty: number;
          seq: number;
          device_id: string;
          reason: "sale" | "restock" | "adjustment" | "transfer";
          user_id: string;
          synced: boolean;
          conflict_flag: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          product_id: string;
          type: "IN" | "OUT";
          delta: number;
          snapshot_qty: number;
          seq?: number;
          device_id: string;
          reason: "sale" | "restock" | "adjustment" | "transfer";
          user_id: string;
          synced?: boolean;
          conflict_flag?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          product_id?: string;
          type?: "IN" | "OUT";
          delta?: number;
          snapshot_qty?: number;
          seq?: number;
          device_id?: string;
          reason?: "sale" | "restock" | "adjustment" | "transfer";
          user_id?: string;
          synced?: boolean;
          conflict_flag?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      sync_queue: {
        Row: {
          id: string;
          shop_id: string;
          table_name: string;
          operation: "INSERT" | "UPDATE" | "DELETE";
          payload: Json;
          status: "pending" | "synced" | "failed";
          error: string | null;
          attempts: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          table_name: string;
          operation: "INSERT" | "UPDATE" | "DELETE";
          payload: Json;
          status?: "pending" | "synced" | "failed";
          error?: string | null;
          attempts?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          table_name?: string;
          operation?: "INSERT" | "UPDATE" | "DELETE";
          payload?: Json;
          status?: "pending" | "synced" | "failed";
          error?: string | null;
          attempts?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      purchase_orders: {
        Row: {
          id: string;
          shop_id: string;
          supplier_name: string;
          status: "draft" | "received" | "partial";
          received_by: string | null;
          received_at: string | null;
          synced: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          supplier_name: string;
          status?: "draft" | "received" | "partial";
          received_by?: string | null;
          received_at?: string | null;
          synced?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          supplier_name?: string;
          status?: "draft" | "received" | "partial";
          received_by?: string | null;
          received_at?: string | null;
          synced?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      po_items: {
        Row: {
          id: string;
          po_id: string;
          product_id: string;
          qty_expected: number;
          qty_received: number;
          unit_cost: number;
        };
        Insert: {
          id?: string;
          po_id: string;
          product_id: string;
          qty_expected: number;
          qty_received?: number;
          unit_cost: number;
        };
        Update: {
          id?: string;
          po_id?: string;
          product_id?: string;
          qty_expected?: number;
          qty_received?: number;
          unit_cost?: number;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          sku: string | null;
          price: number;
          quantity: number;
          min_stock: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          sku?: string | null;
          price: number;
          quantity?: number;
          min_stock?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: string;
          sku?: string | null;
          price?: number;
          quantity?: number;
          min_stock?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      shop_notifications: {
        Row: {
          id: string;
          shop_id: string;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shop_notifications_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      create_additional_shop: {
        Args: { p_name: string; p_address?: string | null };
        Returns: Json;
      };
      expire_stale_subscriptions: {
        Args: Record<string, never>;
        Returns: number;
      };
      owner_delete_shop: {
        Args: { p_shop_id: string };
        Returns: undefined;
      };
      setup_owner_shop: {
        Args: {
          p_user_id: string;
          p_shop_name: string;
          p_shop_address: string | null;
          p_full_name: string;
        };
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
      record_customer_payment: {
        Args: { p_payment: Json };
        Returns: string;
      };
      get_product_analytics: {
        Args: {
          p_shop_id: string;
          p_from: string;
          p_to: string;
          p_limit?: number;
        };
        Returns: {
          product_id: string;
          product_name: string;
          category: string;
          units_sold: number;
          revenue: number;
        }[];
      };
      get_low_stock_products: {
        Args: { p_shop_id: string };
        Returns: {
          id: string;
          name: string;
          sku: string;
          quantity: number;
          min_stock: number;
          room_id: string;
          category: string;
        }[];
      };
      get_sales_summary: {
        Args: { p_shop_id: string; p_from: string; p_to: string };
        Returns: { date: string; total_revenue: number; order_count: number }[];
      };
      get_sales_with_staff: {
        Args: { p_shop_id: string; p_offset?: number; p_limit?: number };
        Returns: {
          id: string;
          total_amount: number;
          payment_method: string;
          created_at: string;
          staff_name: string;
          total_count: number;
          status: string;
          amount_paid: number;
          delivery_address: string | null;
        }[];
      };
      get_shop_team: {
        Args: { p_shop_id: string };
        Returns: {
          user_id: string;
          full_name: string;
          role: string;
          joined_at: string;
        }[];
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
      refresh_sales_summary: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      create_shop_invite: {
        Args: { p_shop_id: string; p_email: string; p_role: "owner" | "staff" };
        Returns: string;
      };
      manage_customer: {
        Args: { p_op: string; p_customer: Json };
        Returns: string;
      };
      manage_product: {
        Args: { p_op: string; p_product: Json };
        Returns: string;
      };
      record_stock_movement: {
        Args: { p_movement: Json };
        Returns: string;
      };
      log_audit_event: {
        Args: {
          p_shop_id: string | null;
          p_event_type: string;
          p_entity_type: string;
          p_entity_id: string;
          p_payload: Json;
          p_severity: string;
        };
        Returns: undefined;
      };
      log_security_event: {
        Args: { p_event_type: string; p_payload: Json; p_severity: string };
        Returns: undefined;
      };
      accept_shop_invite: {
        Args: { p_invite_id: string };
        Returns: string;
      };
      reject_shop_invite: {
        Args: { p_invite_id: string };
        Returns: undefined;
      };
      check_is_owner_by_email: {
        Args: { p_email: string };
        Returns: boolean;
      };
      void_sale: {
        Args: { p_sale_id: string; p_shop_id: string };
        Returns: undefined;
      };
      execute_inventory_transfer: {
        Args: {
          p_source_product_id: string;
          p_variant_id: string | null;
          p_dest_shop_id: string;
          p_dest_room_id: string;
          p_quantity: number;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: "owner" | "staff";
      product_category: "tire" | "battery" | "rim";
      movement_type: "IN" | "OUT";
      movement_reason: "sale" | "restock" | "adjustment" | "transfer";
      po_status: "draft" | "received" | "partial";
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
