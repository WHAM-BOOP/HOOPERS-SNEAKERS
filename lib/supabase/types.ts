/**
 * Hand-maintained database types matching `supabase/migrations/*.sql`.
 * Keep in sync when migrations change (see docs/ARCHITECTURE.md).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  featured: boolean;
  active: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
};

export type ProductVariantRow = {
  id: string;
  product_id: string;
  size: string;
  stock: number;
  created_at: string;
};

export type OrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  note: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
};

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
};

export type ProductWithRelations = ProductRow & {
  category: Pick<CategoryRow, "id" | "slug" | "name"> | null;
  variants: Pick<ProductVariantRow, "id" | "size" | "stock">[];
  images: Pick<ProductImageRow, "id" | "url" | "alt" | "sort_order">[];
};

export type OrderWithItems = OrderRow & {
  items: OrderItemRow[];
};

type TableDef<TRow, TInsert = Partial<TRow>> = {
  Row: TRow;
  Insert: TInsert;
  Update: Partial<TRow>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, { id: string; email: string }>;
      user_roles: TableDef<
        { user_id: string; role: string; created_at: string },
        { user_id: string; role: string }
      >;
      categories: TableDef<CategoryRow>;
      products: TableDef<ProductRow>;
      product_images: TableDef<ProductImageRow>;
      product_variants: TableDef<ProductVariantRow>;
      orders: TableDef<OrderRow>;
      order_items: TableDef<OrderItemRow>;
      contact_messages: TableDef<ContactMessageRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      next_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      place_order: {
        Args: {
          p_customer: Json;
          p_user_id: string | null;
          p_items: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
