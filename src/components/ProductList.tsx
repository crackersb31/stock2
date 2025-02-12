
import { Product } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface ProductListProps {
  products: Product[];
  onProductsChange: (newProducts: Product[]) => void;
}

export function ProductList({ products, onProductsChange }: ProductListProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = async (product: Product, change: number) => {
    const newQuantity = product.quantity + change;

    if (newQuantity < 0) {
      toast({
        title: "Erreur",
        description: "La quantité ne peut pas être négative.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Première étape : Mise à jour de la quantité
      const { error: updateError } = await supabase
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", product.id);

      if (updateError) {
        console.error("Erreur de mise à jour de la quantité:", updateError);
        throw updateError;
      }

      // Deuxième étape : Vérifier si un mouvement similaire existe déjà
      const { data: existingMovements, error: checkError } = await supabase
        .from("product_movements")
        .select()
        .eq('product_id', product.id)
        .eq('movement_type', change > 0 ? 'increment' : 'decrement')
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkError) {
        console.error("Erreur lors de la vérification des mouvements:", checkError);
        throw checkError;
      }

      // Si un mouvement similaire existe, mettre à jour sa quantité
      if (existingMovements && existingMovements.length > 0) {
        const { error: updateMovementError } = await supabase
          .from("product_movements")
          .update({ quantity: existingMovements[0].quantity + Math.abs(change) })
          .eq('id', existingMovements[0].id);

        if (updateMovementError) {
          console.error("Erreur lors de la mise à jour du mouvement:", updateMovementError);
          throw updateMovementError;
        }
      } else {
        // Si aucun mouvement similaire n'existe, créer un nouveau
        const { error: movementError } = await supabase
          .from("product_movements")
          .insert([{
            product_id: product.id,
            name: product.name,
            movement_type: change > 0 ? 'increment' : 'decrement',
            quantity: Math.abs(change)
          }]);

        if (movementError) {
          console.error("Erreur d'enregistrement du mouvement:", movementError);
          throw movementError;
        }
      }

      const updatedProducts = products.map((p) =>
        p.id === product.id ? { ...p, quantity: newQuantity } : p
      );
      onProductsChange(updatedProducts);

      toast({
        title: "Quantité mise à jour",
        description: `La quantité de ${product.name} est maintenant de ${newQuantity} ${product.unit}`,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setLoading(true);
    try {
      // First, set product_id to null in related movement records
      // Get product name before deleting
      const productToDelete = products.find(p => p.id === productId);
      if (!productToDelete) {
        throw new Error("Product not found");
      }

      const { error: movementError } = await supabase
        .from("product_movements")
        .update({ 
          product_id: null,
          name: productToDelete.name // Save the name before nullifying the reference
        })
        .eq("product_id", productId);

      if (movementError) {
        console.error("Erreur lors de la mise à jour des mouvements:", movementError);
        toast({
          title: "Erreur",
          description: "Erreur lors de la mise à jour de l'historique des mouvements.",
          variant: "destructive",
        });
        return;
      }

      // Then delete the product
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (deleteError) {
        console.error("Erreur lors de la suppression du produit:", deleteError);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression du produit.",
          variant: "destructive",
        });
        return;
      }

      const updatedProducts = products.filter((p) => p.id !== productId);
      onProductsChange(updatedProducts);

      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      });
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Sous-catégorie</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Unité</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{product.subcategory}</TableCell>
              <TableCell>{product.quantity}</TableCell>
              <TableCell>{product.unit}</TableCell>
              <TableCell>{product.price}€</TableCell>
              <TableCell>
                {product.quantity <= product.minQuantity ? (
                  <Badge variant="destructive">Stock bas</Badge>
                ) : (
                  <Badge variant="secondary">En stock</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product, -1)}
                    disabled={loading}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product, 1)}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteProduct(product.id)}
                    disabled={loading}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
