
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { StockOverview } from "@/components/StockOverview";
import { ProductList } from "@/components/ProductList";
import { Product } from "@/lib/types";
import { AddProductDialog } from "@/components/AddProductDialog";
import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { IntroVideo } from "@/components/IntroVideo";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Record<string, string[]>>({
    entretien: [],
    alimentation: [],
    cosmétiques: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchSubcategories();
  }, []);

  const fetchProducts = async () => {
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
      const formattedProducts: Product[] = data.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category as "entretien" | "alimentation" | "cosmétiques",
        subcategory: product.subcategory,
        quantity: product.quantity,
        minQuantity: product.min_quantity,
        unit: product.unit,
        price: product.price
      }));
      setProducts(formattedProducts);
    }
  };

  const fetchSubcategories = async () => {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        subcategories (
          name
        )
      `);

    if (categoriesError) {
      console.error("Erreur lors de la récupération des sous-catégories:", categoriesError);
      return;
    }

    if (categoriesData) {
      const newSubcategories: Record<string, string[]> = {
        entretien: [],
        alimentation: [],
        cosmétiques: [],
      };
      
      categoriesData.forEach(category => {
        if (category.subcategories) {
          const categoryName = category.name.toLowerCase();
          newSubcategories[categoryName] = category.subcategories.map(sub => sub.name);
        }
      });
      
      setSubcategories(newSubcategories);
    }
  };

  const handleAddProduct = async (newProduct: Omit<Product, "id">) => {
    try {
      // Mettre à jour la liste des produits
      await fetchProducts();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la liste des produits:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir la liste des produits.",
        variant: "destructive",
      });
    }
  };

  const handleAddSubcategory = async (category: string, subcategory: string) => {
    try {
      const currentSubcategories = subcategories[category.toLowerCase()] || [];
      if (currentSubcategories.length >= 12) {
        toast({
          title: "Limite atteinte",
          description: "Vous ne pouvez pas ajouter plus de 12 sous-catégories par catégorie.",
          variant: "destructive",
        });
        return;
      }

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();

      if (categoryError) throw categoryError;

      const { error: subcategoryError } = await supabase
        .from('subcategories')
        .insert([{ category_id: categoryData.id, name: subcategory }]);

      if (subcategoryError) throw subcategoryError;

      setSubcategories(prev => ({
        ...prev,
        [category.toLowerCase()]: [...(prev[category.toLowerCase()] || []), subcategory]
      }));

      toast({
        title: "Sous-catégorie ajoutée",
        description: `La sous-catégorie "${subcategory}" a été ajoutée avec succès.`,
      });

    } catch (error) {
      console.error("Erreur lors de l'ajout de la sous-catégorie:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la sous-catégorie.",
        variant: "destructive",
      });
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      // D'abord trier par catégorie
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) return categoryCompare;
      
      // Ensuite trier par sous-catégorie
      return a.subcategory.localeCompare(b.subcategory);
    });
  };

  const filteredProducts = selectedCategory === null 
    ? sortProducts(products)
    : sortProducts(products.filter(product => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      ));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          onSubcategoryAdd={handleAddSubcategory}
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
        />
        <main className="flex-1 p-8">
          <div className="flex flex-col gap-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-5xl font-bold text-orange-500">Le stock de Marie</h1>
                <AddProductDialog onAddProduct={handleAddProduct} subcategories={subcategories} />
              </div>
              <IntroVideo />
              <StockOverview products={products} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Produits en stock bas</h2>
              <ProductList
                products={sortProducts(filteredProducts.filter((p) => p.quantity <= p.minQuantity))}
                onProductsChange={async () => {
                  await fetchProducts();
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Tous les produits</h2>
              <ProductList
                products={filteredProducts}
                onProductsChange={async () => {
                  await fetchProducts();
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
