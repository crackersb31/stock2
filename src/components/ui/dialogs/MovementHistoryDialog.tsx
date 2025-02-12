
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MovementHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Movement {
  id: string;
  product_id: string;
  movement_type: "increment" | "decrement";
  quantity: number;
  created_at: string;
  product_name: string;
  product_unit: string;
}

export function MovementHistoryDialog({
  open,
  onOpenChange,
}: MovementHistoryDialogProps) {
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    if (open) {
      fetchMovements();
    }
  }, [open]);

  const fetchMovements = async () => {
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
      }));
      setMovements(formattedMovements);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Historique des mouvements de stock</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Type de mouvement</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Unité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {format(new Date(movement.created_at), "dd MMMM yyyy HH:mm", {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell>{movement.product_name}</TableCell>
                  <TableCell>
                    {movement.movement_type === "increment" ? "+" : "-"}
                  </TableCell>
                  <TableCell>{movement.quantity}</TableCell>
                  <TableCell>{movement.product_unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
