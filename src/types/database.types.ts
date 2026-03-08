export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            business_members: {
                Row: {
                    business_id: string
                    created_at: string | null
                    id: string
                    role: Database["public"]["Enums"]["app_role"]
                    user_id: string
                }
                Insert: {
                    business_id: string
                    created_at?: string | null
                    id?: string
                    role?: Database["public"]["Enums"]["app_role"]
                    user_id: string
                }
                Update: {
                    business_id?: string
                    created_at?: string | null
                    id?: string
                    role?: Database["public"]["Enums"]["app_role"]
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "business_members_business_id_fkey"
                        columns: ["business_id"]
                        isOneToOne: false
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "business_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            businesses: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    settings: Json | null
                    slug: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    settings?: Json | null
                    slug: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    settings?: Json | null
                    slug?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            inventory_movements: {
                Row: {
                    business_id: string
                    created_at: string | null
                    id: string
                    quantity: number
                    reference_id: string | null
                    type: string
                    variant_id: string
                }
                Insert: {
                    business_id: string
                    created_at?: string | null
                    id?: string
                    quantity: number
                    reference_id?: string | null
                    type: string
                    variant_id: string
                }
                Update: {
                    business_id?: string
                    created_at?: string | null
                    id?: string
                    quantity?: number
                    reference_id?: string | null
                    type?: string
                    variant_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "inventory_movements_business_id_fkey"
                        columns: ["business_id"]
                        isOneToOne: false
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "inventory_movements_variant_id_fkey"
                        columns: ["variant_id"]
                        isOneToOne: false
                        referencedRelation: "product_variants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            product_variants: {
                Row: {
                    attributes: Json | null
                    business_id: string
                    cost: number | null
                    created_at: string | null
                    id: string
                    price: number
                    product_id: string
                    sku: string | null
                    stock_level: number | null
                }
                Insert: {
                    attributes?: Json | null
                    business_id: string
                    cost?: number | null
                    created_at?: string | null
                    id?: string
                    price?: number
                    product_id: string
                    sku?: string | null
                    stock_level?: number | null
                }
                Update: {
                    attributes?: Json | null
                    business_id?: string
                    cost?: number | null
                    created_at?: string | null
                    id?: string
                    price?: number
                    product_id?: string
                    sku?: string | null
                    stock_level?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "product_variants_business_id_fkey"
                        columns: ["business_id"]
                        isOneToOne: false
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "product_variants_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    business_id: string
                    created_at: string | null
                    description: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    updated_at: string | null
                }
                Insert: {
                    business_id: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    updated_at?: string | null
                }
                Update: {
                    business_id?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "products_business_id_fkey"
                        columns: ["business_id"]
                        isOneToOne: false
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            sale_items: {
                Row: {
                    business_id: string
                    id: string
                    quantity: number
                    sale_id: string
                    subtotal: number | null
                    unit_price: number
                    variant_id: string | null
                }
                Insert: {
                    business_id: string
                    id?: string
                    quantity?: number
                    sale_id: string
                    subtotal?: never
                    unit_price: number
                    variant_id?: string | null
                }
                Update: {
                    business_id?: string
                    id?: string
                    quantity?: number
                    sale_id?: string
                    subtotal?: never
                    unit_price?: number
                    variant_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "sale_items_business_id_fkey"
                        columns: ["business_id"]
                        isOneToOne: false
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "sale_items_sale_id_fkey"
                        columns: ["sale_id"]
                        isOneToOne: false
                        referencedRelation: "sales"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "sale_items_variant_id_fkey"
                        columns: ["variant_id"]
                        isOneToOne: false
                        referencedRelation: "product_variants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            sales: {
                Row: {
                    business_id: string
                    created_at: string | null
                    customer_id: string | null
                    id: string
                    payment_method: string | null
                    seller_id: string | null
                    status: string | null
                    total: number
                }
                Insert: {
                    business_id: string
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    payment_method?: string | null
                    seller_id?: string | null
                    status?: string | null
                    total?: number
                }
                Update: {
                    business_id?: string
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    payment_method?: string | null
                    seller_id?: string | null
                    status?: string | null
                    total?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "sales_business_id_fkey"
                        columns: ["business_id"]
                        isOneToOne: false
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "sales_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            app_role: "owner" | "admin" | "staff" | "viewer"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
