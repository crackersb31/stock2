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
import { addWeeks, format, parseISO, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";

interface ProductMovements {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  movement_count: number;
  last_movement?: string;
}

export function MovementAnalysisStats() {
  const [activeProducts, setActiveProducts] = useState<ProductMovements[]>([]);
  const [inactiveOneWeek, setInactiveOneWeek] = useState<ProductMovements[]>([]);
  const [inactiveTwoWeeks, setInactiveTwoWeeks] = useState<ProductMovements[]>([]);
  const [inactiveMoreThanTwoWeeks, setInactiveMoreThanTwoWeeks] = useState<ProductMovements[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleClick = async () => {
    if (!isVisible) {
      setIsVisible(true);
      await fetchMovementStats();
    } else {
      setIsVisible(false);
      setActiveProducts([]);
      setInactiveOneWeek([]);
      setInactiveTwoWeeks([]);
      setInactiveMoreThanTwoWeeks([]);
    }
  };

  const fetchMovementStats = async () => {
    setLoading(true);
    try {
      // 1. Récupérer le nombre de mouvements par produit
      const { data: movementData, error: movementError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          subcategory,
          product_movements (
            id,
            created_at
          )
        `);

      if (movementError) throw movementError;

      const now = new Date();
      const oneWeekAgo = subWeeks(now, 1);
      const twoWeeksAgo = subWeeks(now, 2);

      const productsWithStats = movementData.map(product => {
        const movements = product.product_movements || [];
        const lastMovement = movements.length > 0 
          ? movements.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0].created_at
          : undefined;

        return {
          id: product.id,
          name: product.name,
          category: product.category,
          subcategory: product.subcategory,
          movement_count: movements.length,
          last_movement: lastMovement
        };
      });

      // Trier par nombre de mouvements (décroissant)
      const active = [...productsWithStats]
        .sort((a, b) => b.movement_count - a.movement_count)
        .filter(p => p.movement_count > 0);

      // Produits sans mouvement depuis 1 semaine (mais moins de 2 semaines)
      const oneWeekInactive = productsWithStats.filter(product => {
        if (!product.last_movement) return false;
        const lastMove = parseISO(product.last_movement);
        return lastMove < oneWeekAgo && lastMove >= twoWeeksAgo;
      });

      // Produits sans mouvement depuis 2 semaines exactement
      const twoWeeksInactive = productsWithStats.filter(product => {
        if (!product.last_movement) return false;
        const lastMove = parseISO(product.last_movement);
        return lastMove < twoWeeksAgo && lastMove >= subWeeks(twoWeeksAgo, 1);
      });

      // Produits sans mouvement depuis plus de 2 semaines
      const moreThanTwoWeeksInactive = productsWithStats.filter(product => {
        if (!product.last_movement) return true;
        const lastMove = parseISO(product.last_movement);
        return lastMove < subWeeks(twoWeeksAgo, 1);
      });

      setActiveProducts(active);
      setInactiveOneWeek(oneWeekInactive);
      setInactiveTwoWeeks(twoWeeksInactive);
      setInactiveMoreThanTwoWeeks(moreThanTwoWeeksInactive);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (products: ProductMovements[], title: string, description: string) => (
    <div className="bg-white rounded-lg shadow mb-8">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Sous-catégorie</TableHead>
              <TableHead>Nombre de mouvements</TableHead>
              <TableHead>Dernier mouvement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.subcategory}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {product.movement_count}
                  </Badge>
                </TableCell>
                <TableCell>
                  {product.last_movement 
                    ? format(parseISO(product.last_movement), "dd MMMM yyyy", { locale: fr })
                    : "Aucun mouvement"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

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
        title="Analyse des mouvements"
        description="Visualisez les produits selon leur fréquence de modification"
        onClick={handleClick}
      />

      {isVisible && (
        <div className="mt-4">
          {renderTable(
            activeProducts,
            "Produits les plus modifiés",
            "Liste des produits triés par nombre de modifications"
          )}
          
          {renderTable(
            inactiveOneWeek,
            "Produits inactifs depuis 1-2 semaines",
            "Produits sans modification depuis 1 à 2 semaines"
          )}
          
          {renderTable(
            inactiveTwoWeeks,
            "Produits inactifs depuis 2-3 semaines",
            "Produits sans modification depuis 2 à 3 semaines"
          )}
          
          {renderTable(
            inactiveMoreThanTwoWeeks,
            "Produits inactifs depuis plus de 2 semaines",
            "Produits sans modification depuis plus de 3 semaines ou sans aucun mouvement"
          )}
        </div>
      )}
    </div>
  );
}
