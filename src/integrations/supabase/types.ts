export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string | null;
          settings: Json | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string | null;
          settings?: Json | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string | null;
          settings?: Json | null;
        };
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: string; // 'admin' | 'staff' etc
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          business_id: string;
          sku: string | null;
          price: number;
          cost: number | null;
          stock_level: number;
          attributes: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          business_id: string;
          sku?: string | null;
          price: number;
          cost?: number | null;
          stock_level?: number;
          attributes?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          business_id?: string;
          sku?: string | null;
          price?: number;
          cost?: number | null;
          stock_level?: number;
          attributes?: Json | null;
          created_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string | null;
          seller_id: string | null;
          total: number;
          status: string; // 'completed', 'pending'
          payment_method: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id?: string | null;
          seller_id?: string | null;
          total: number;
          status?: string;
          payment_method?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          customer_id?: string | null;
          seller_id?: string | null;
          total?: number;
          status?: string;
          payment_method?: string;
          created_at?: string;
        };
      };
      sale_items: {
        Row: {
          id: string;
          battle_id: string; // This might be a typo in my manual, but let's assume it's sale_id based on FK
          sale_id: string;
          business_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          sale_id: string;
          business_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Update: {
          id?: string;
          sale_id?: string;
          business_id?: string;
          variant_id?: string | null;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      // Keeping original placeholder if needed
    };
    Enums: {
      // Keeping original placeholder if needed
    };
  };
};
