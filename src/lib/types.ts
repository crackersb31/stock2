export type Product = {
  id: string;
  name: string;
  category: "entretien" | "alimentation" | "cosmétiques";
  subcategory: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  price: number;
};

export type CategoryInfo = {
  id: "entretien" | "alimentation" | "cosmétiques";
  name: string;
  icon: string;
  totalProducts: number;
  lowStock: number;
  subcategories: string[];
};