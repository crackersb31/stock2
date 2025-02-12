export interface Movement {
  id: string;
  product_id: string;
  movement_type: "increment" | "decrement";
  quantity: number;
  created_at: string;
  product_name: string;
  product_unit: string;
  formatted_date: string;
}
