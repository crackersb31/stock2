
import { Product } from "@/lib/types";
import { Package, Utensils, Sparkles } from "lucide-react";
import { useMemo } from "react";

interface StockOverviewProps {
  products: Product[];
}

export function StockOverview({ products }: StockOverviewProps) {
  const categories = useMemo(() => [
    {
      id: "entretien" as const,
      name: "Entretien",
      icon: Package,
      subcategories: ["Nettoyage", "Bricolage", "Jardinage"],
      totalProducts: products.filter(p => p.category.toLowerCase() === "entretien").length,
      lowStock: products.filter(p => p.category.toLowerCase() === "entretien" && p.quantity <= p.minQuantity).length,
    },
    {
      id: "alimentation" as const,
      name: "Alimentation",
      icon: Utensils,
      subcategories: ["Conserves", "Produits frais", "Épicerie"],
      totalProducts: products.filter(p => p.category.toLowerCase() === "alimentation").length,
      lowStock: products.filter(p => p.category.toLowerCase() === "alimentation" && p.quantity <= p.minQuantity).length,
    },
    {
      id: "cosmétiques" as const,
      name: "Cosmétiques",
      icon: Sparkles,
      subcategories: ["Soins visage", "Soins corps", "Hygiène"],
      totalProducts: products.filter(p => p.category.toLowerCase() === "cosmétiques").length,
      lowStock: products.filter(p => p.category.toLowerCase() === "cosmétiques" && p.quantity <= p.minQuantity).length,
    },
  ], [products]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="p-4 border rounded-lg space-y-4"
        >
          <div className="flex items-center space-x-2">
            <category.icon className="w-5 h-5" />
            <h3 className="font-semibold">{category.name}</h3>
          </div>
          <div className="space-y-2">
            <p>Produits: {category.totalProducts}</p>
            <p>Stock bas: {category.lowStock}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
