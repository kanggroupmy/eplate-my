import type { CanonicalOrderStatus } from "./domain";
export type OrderStatus = CanonicalOrderStatus;

export type OrderRow = {
  id: string;
  customer_id: string;
  status: OrderStatus;
  owner_name: string;
  vehicle_registration: string;
  chassis_vin: string;
  vehicle_type_confirmed: boolean;
  workshop_key: string;
  package_price: number;
  official_plate_price: number;
  created_at: string;
  updated_at: string;
};

export type DocumentType = "voc_geran" | "mykad" | "payment_proof" | "invoice";

export type CustomerRow = {
  id: string;
  user_id: string;
  email: string | null;
  whatsapp_phone: string | null;
  created_at: string;
};
