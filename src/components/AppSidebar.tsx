
import { Package, Utensils, Sparkles, Plus, Filter, FilterX, History, BarChart } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { CategoryDialog } from "./ui/dialogs/CategoryDialog";
import { MovementHistoryDialog } from "./ui/dialogs/MovementHistoryDialog";
import { supabase } from "@/integrations/supabase/client";

const categoryMapping = {
  "Entretien": "maintenance",
  "Alimentation": "food",
  "Cosmétiques": "cosmetics",
};

const items = [
  {
    title: "Vue d'ensemble",
    url: "/",
    icon: Package,
  },
  {
    title: "Entretien",
    url: "/maintenance",
    icon: Package,
  },
  {
    title: "Alimentation",
    url: "/food",
    icon: Utensils,
  },
  {
    title: "Cosmétiques",
    url: "/cosmetics",
    icon: Sparkles,
  },
];

interface AppSidebarProps {
  onSubcategoryAdd?: (category: string, subcategory: string) => Promise<void>;
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

export function AppSidebar({ onSubcategoryAdd, onCategorySelect, selectedCategory }: AppSidebarProps) {
  const location = useLocation();
  const { toast } = useToast();
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<string | null>(null);

  const handleAddCategory = async (categoryName: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: categoryName }]);

      if (error) {
        console.error("Erreur lors de l'ajout de la catégorie:", error);
        toast({
          title: "Erreur",
          description: "Erreur lors de l'ajout de la catégorie.",
          variant: "destructive",
        });
        return;
      }

      console.log("Nouvelle catégorie ajoutée:", data);
      toast({
        title: "Catégorie ajoutée",
        description: `La catégorie "${categoryName}" a été ajoutée avec succès.`,
      });
    } catch (error) {
      console.error("Erreur inattendue lors de l'ajout de la catégorie:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    }
  };

  const handleAddSubcategory = async (subcategoryName: string) => {
    if (selectedCategoryForAdd && selectedCategoryForAdd in categoryMapping) {
      try {
        // Récupérer l'ID de la catégorie
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', selectedCategoryForAdd)
          .single();

        if (categoryError || !categoryData) {
          console.error("Erreur lors de la récupération de l'ID de la catégorie:", categoryError);
          toast({
            title: "Erreur",
            description: "Erreur lors de la récupération de la catégorie.",
            variant: "destructive",
          });
          return;
        }

        // Compter le nombre de sous-catégories existantes
        const { count, error: countError } = await supabase
          .from('subcategories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', categoryData.id);

        if (countError) {
          console.error("Erreur lors du comptage des sous-catégories:", countError);
          toast({
            title: "Erreur",
            description: "Erreur lors de la vérification du nombre de sous-catégories.",
            variant: "destructive",
          });
          return;
        }

        if (count && count >= 12) {
          toast({
            title: "Limite atteinte",
            description: "Vous ne pouvez pas ajouter plus de 12 sous-catégories par catégorie.",
            variant: "destructive",
          });
          return;
        }

        // Vérifier si la sous-catégorie existe déjà
        const { data: existingSubcategory, error: checkError } = await supabase
          .from('subcategories')
          .select('name')
          .eq('category_id', categoryData.id)
          .eq('name', subcategoryName)
          .maybeSingle();

        if (checkError) {
          console.error("Erreur lors de la vérification de la sous-catégorie:", checkError);
          toast({
            title: "Erreur",
            description: "Erreur lors de la vérification de la sous-catégorie.",
            variant: "destructive",
          });
          return;
        }

        if (existingSubcategory) {
          toast({
            title: "Erreur",
            description: `La sous-catégorie "${subcategoryName}" existe déjà pour cette catégorie.`,
            variant: "destructive",
          });
          return;
        }

        // Ajouter la nouvelle sous-catégorie
        const { error: insertError } = await supabase
          .from('subcategories')
          .insert([{ 
            category_id: categoryData.id, 
            name: subcategoryName 
          }]);

        if (insertError) {
          console.error("Erreur lors de l'ajout de la sous-catégorie:", insertError);
          toast({
            title: "Erreur",
            description: "Erreur lors de l'ajout de la sous-catégorie.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Sous-catégorie ajoutée",
          description: `La sous-catégorie "${subcategoryName}" a été ajoutée avec succès.`,
        });

        setIsAddSubcategoryOpen(false);

        // Appeler la fonction de callback si elle existe
        if (onSubcategoryAdd) {
          await onSubcategoryAdd(selectedCategoryForAdd, subcategoryName);
        }
      } catch (error) {
        console.error("Erreur inattendue lors de l'ajout de la sous-catégorie:", error);
        toast({
          title: "Erreur",
          description: "Une erreur inattendue s'est produite lors de l'ajout de la sous-catégorie.",
          variant: "destructive",
        });
      }
    }
  };

  const openSubcategoryDialog = (categoryTitle: string) => {
    setSelectedCategoryForAdd(categoryTitle);
    setIsAddSubcategoryOpen(true);
  };

  const handleCategoryClick = (item: typeof items[0]) => {
    if (onCategorySelect) {
      if (item.title === "Vue d'ensemble") {
        onCategorySelect(null);
      } else {
        onCategorySelect(item.title);
      }
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex justify-between items-center pr-2">
            <SidebarGroupLabel>Gestion de Stock</SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddCategoryOpen(true)}
              className="h-6 w-6"
              title="Ajouter une catégorie"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <div className="flex items-center w-full">
                    <SidebarMenuButton
                      asChild
                      className={
                        location.pathname === item.url || 
                        (selectedCategory === item.title.toLowerCase() && item.url !== "/")
                          ? "bg-accent flex-grow"
                          : "flex-grow"
                      }
                      onClick={() => handleCategoryClick(item)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </div>
                        {item.url !== "/" && selectedCategory === item.title.toLowerCase() && (
                          <FilterX className="w-4 h-4 ml-2" />
                        )}
                        {item.url !== "/" && selectedCategory !== item.title.toLowerCase() && (
                          <Filter className="w-4 h-4 ml-2" />
                        )}
                      </div>
                    </SidebarMenuButton>
                    {item.url !== "/" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSubcategoryDialog(item.title)}
                        className="h-6 w-6 ml-1"
                        title="Ajouter une sous-catégorie"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-8 px-4 space-y-4">
          <img 
            src="/lovable-uploads/b428e15e-7c71-45fc-b85f-defa88f5b0d9.png" 
            alt="Illustration de gestion de stock"
            className="w-full rounded-lg shadow-lg"
          />
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsHistoryOpen(true)}
            >
              <History className="w-4 h-4 mr-2" />
              Historique des mouvements
            </Button>
            <Link to="/statistics" className="w-full">
              <Button 
                variant="outline" 
                className="w-full"
              >
                <BarChart className="w-4 h-4 mr-2" />
                Statistiques
              </Button>
            </Link>
          </div>
        </div>
      </SidebarContent>

      <CategoryDialog
        open={isAddCategoryOpen}
        onOpenChange={setIsAddCategoryOpen}
        onSubmit={handleAddCategory}
        title="Ajouter une catégorie"
        description="Entrez le nom de la nouvelle catégorie"
      />

      <CategoryDialog
        open={isAddSubcategoryOpen}
        onOpenChange={setIsAddSubcategoryOpen}
        onSubmit={handleAddSubcategory}
        title={`Ajouter une sous-catégorie à ${selectedCategoryForAdd}`}
        description="Entrez le nom de la nouvelle sous-catégorie"
      />

      <MovementHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />
    </Sidebar>
  );
}
