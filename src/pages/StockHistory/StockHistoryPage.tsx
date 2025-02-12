import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { StockHistoryTable } from "./components/StockHistoryTable";
import { StockHistoryHeader } from "./components/StockHistoryHeader";
import { Movement } from "./types";

export function StockHistoryPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_movements")
        .select(`
          *,
          products (
            name,
            unit
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération des mouvements:", error);
        return;
      }

      if (data) {
        const formattedMovements: Movement[] = data.map((movement) => ({
          id: movement.id,
          product_id: movement.product_id!,
          movement_type: movement.movement_type as "increment" | "decrement",
          quantity: movement.quantity,
          created_at: movement.created_at,
          product_name: movement.products?.name || "Produit supprimé",
          product_unit: movement.products?.unit || "-",
          formatted_date: format(new Date(movement.created_at), "dd MMMM yyyy HH:mm", {
            locale: fr,
          })
        }));
        setMovements(formattedMovements);
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8 px-4">
        <StockHistoryHeader />
        <div className="mt-8">
          <StockHistoryTable movements={movements} loading={loading} />
        </div>
      </div>
    </div>
  );
}
