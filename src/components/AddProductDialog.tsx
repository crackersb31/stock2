import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Product } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  category: z.enum(["entretien", "alimentation", "cosmétiques"], {
    required_error: "Veuillez sélectionner une catégorie.",
  }),
  subcategory: z.string().min(1, {
    message: "Veuillez sélectionner une sous-catégorie.",
  }),
  quantity: z.coerce.number().min(0, {
    message: "La quantité doit être positive.",
  }),
  minQuantity: z.coerce.number().min(0, {
    message: "La quantité minimale doit être positive.",
  }),
  unit: z.string().min(1, {
    message: "Veuillez spécifier une unité.",
  }),
  price: z.coerce.number().min(0, {
    message: "Le prix doit être positif.",
  }),
});

interface AddProductDialogProps {
  onAddProduct: (product: Omit<Product, "id">) => void;
  subcategories: Record<string, string[]>;
}

export function AddProductDialog({ onAddProduct, subcategories }: AddProductDialogProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<"entretien" | "alimentation" | "cosmétiques" | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: undefined,
      subcategory: "",
      quantity: 0,
      minQuantity: 0,
      unit: "",
      price: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log('Début onSubmit - valeurs reçues:', values);

      // Insérer le produit avec la quantité initiale
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: values.name,
          category: values.category,
          subcategory: values.subcategory,
          quantity: values.quantity,
          min_quantity: values.minQuantity,
          unit: values.unit,
          price: values.price,
        })
        .select()
        .single();

      if (productError) {
        throw productError;
      }

      if (!productData) {
        throw new Error("Aucune donnée retournée après l'insertion");
      }

      // Si le produit a été inséré avec succès et qu'il y a une quantité initiale
      if (values.quantity > 0) {
        const { error: movementError } = await supabase
          .from('product_movements')
          .insert({
            product_id: productData.id,
            name: values.name,
            movement_type: 'increment',
            quantity: values.quantity
          });

        if (movementError) {
          console.error('Erreur lors de la création du mouvement initial:', movementError);
        }
      }

      const productToInsert = {
        name: values.name,
        category: values.category,
        subcategory: values.subcategory,
        quantity: values.quantity,
        minQuantity: values.minQuantity,
        unit: values.unit,
        price: values.price,
      };
      
      onAddProduct(productToInsert);
      form.reset();
      setSelectedCategory(null);
      setOpen(false);
      toast({
        title: "Succès",
        description: `${values.name} a été ajouté avec succès.`,
      });

    } catch (e: any) {
      console.error('Erreur attrapée:', e);
      toast({
        title: "Erreur",
        description: e.message || "Une erreur est survenue lors de l'ajout",
        variant: "destructive"
      });
    }
  }

  const handleCategoryChange = (category: "entretien" | "alimentation" | "cosmétiques") => {
    setSelectedCategory(category);
    form.setValue("category", category);
    form.setValue("subcategory", "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau produit</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire pour ajouter un nouveau produit
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="add-product-form">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">Nom</FormLabel>
                  <FormControl>
                    <Input id="name" placeholder="Nom du produit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="category">Catégorie</FormLabel>
                  <Select
                    onValueChange={handleCategoryChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entretien">Entretien</SelectItem>
                      <SelectItem value="alimentation">Alimentation</SelectItem>
                      <SelectItem value="cosmétiques">Cosmétiques</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="subcategory">Sous-catégorie</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCategory}
                  >
                    <FormControl>
                      <SelectTrigger id="subcategory">
                        <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedCategory &&
                        subcategories[selectedCategory].map(
                          (subcat) => (
                            <SelectItem key={subcat} value={subcat}>
                              {subcat}
                            </SelectItem>
                          )
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="quantity">Quantité</FormLabel>
                  <FormControl>
                    <Input id="quantity" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="minQuantity">Quantité minimale</FormLabel>
                  <FormControl>
                    <Input id="minQuantity" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="unit">Unité</FormLabel>
                  <FormControl>
                    <Input id="unit" placeholder="ex: kg, L, unités" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="price">Prix</FormLabel>
                  <FormControl>
                    <Input id="price" type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Ajouter
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
