import { useState } from "react";
import { StatsButton } from "./StatsButton";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ProductWithDifference {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  difference: number;
  unit: string;
  category: string;
  subcategory: string;
}

export function QuantityDifferenceStats() {
  const [products, setProducts] = useState<ProductWithDifference[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const handleClick = async () => {
    if (!isVisible) {
      setIsVisible(true);
      await fetchProducts();
    } else {
      setIsVisible(false);
      setProducts([]);
      setSearchTerm("");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order('category')
        .order('subcategory');

      if (error) {
        console.error("Erreur lors de la récupération des produits:", error);
        return;
      }

      if (data) {
        const productsWithDifference: ProductWithDifference[] = data
          .map(product => ({
            id: product.id,
            name: product.name,
            quantity: product.quantity,
            minQuantity: product.min_quantity,
            difference: product.quantity - product.min_quantity,
            unit: product.unit,
            category: product.category,
            subcategory: product.subcategory
          }))
          .sort((a, b) => b.difference - a.difference); // Tri par différence décroissante

        setProducts(productsWithDifference);
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatsButton
        title="Écart entre stock et minimum"
        description="Visualisez les produits triés par l'écart entre leur quantité actuelle et minimum"
        onClick={handleClick}
      />

      {isVisible && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Résultats</h2>
                <p className="text-gray-600">
                  Liste des produits triés par l'écart entre leur quantité actuelle et leur quantité minimum
                </p>
              </div>
              <div className="relative w-72">
                <Input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Sous-catégorie</TableHead>
              <TableHead>Quantité actuelle</TableHead>
              <TableHead>Quantité minimum</TableHead>
              <TableHead>Écart</TableHead>
              <TableHead>Unité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products
              .filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.subcategory}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>{product.minQuantity}</TableCell>
                <TableCell>
                  <Badge 
                    variant={product.difference <= 0 ? "destructive" : "secondary"}
                  >
                    {product.difference > 0 ? "+" : ""}{product.difference}
                  </Badge>
                </TableCell>
                <TableCell>{product.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
