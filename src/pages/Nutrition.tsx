import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Utensils } from "lucide-react";
import Layout from "@/components/Layout";
import { z } from "zod";

const mealSchema = z.object({
  meal_name: z.string().trim().min(1, "Meal name is required").max(100, "Meal name must be less than 100 characters"),
  meal_type: z.string().nullable(),
  calories: z.number().int().min(0, "Calories cannot be negative").max(10000, "Calories cannot exceed 10000"),
  protein_g: z.number().int().min(0, "Protein cannot be negative").max(500, "Protein cannot exceed 500g").nullable(),
  carbs_g: z.number().int().min(0, "Carbs cannot be negative").max(1000, "Carbs cannot exceed 1000g").nullable(),
  fat_g: z.number().int().min(0, "Fat cannot be negative").max(500, "Fat cannot exceed 500g").nullable(),
});

interface Meal {
  id: string;
  meal_type: string;
  meal_name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  date: string;
}

const Nutrition = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    meal_type: "breakfast",
    meal_name: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load meals");
      return;
    }

    setMeals(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Validate input data
      const validatedData = mealSchema.parse({
        meal_name: formData.meal_name,
        meal_type: formData.meal_type || null,
        calories: parseInt(formData.calories),
        protein_g: formData.protein_g ? parseInt(formData.protein_g) : null,
        carbs_g: formData.carbs_g ? parseInt(formData.carbs_g) : null,
        fat_g: formData.fat_g ? parseInt(formData.fat_g) : null,
      });

      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        meal_name: validatedData.meal_name,
        meal_type: validatedData.meal_type,
        calories: validatedData.calories,
        protein_g: validatedData.protein_g,
        carbs_g: validatedData.carbs_g,
        fat_g: validatedData.fat_g,
      });

      if (error) {
        toast.error("Failed to add meal");
        console.error(error);
        return;
      }

      toast.success("Meal added successfully!");
      setFormData({
        meal_type: "breakfast",
        meal_name: "",
        calories: "",
        protein_g: "",
        carbs_g: "",
        fat_g: "",
      });
      setOpen(false);
      loadMeals();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to add meal");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("meals").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete meal");
      return;
    }

    toast.success("Meal deleted");
    loadMeals();
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat_g || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Utensils className="h-8 w-8 text-accent" />
              Nutrition
            </h1>
            <p className="text-muted-foreground">Track your daily meals and macros</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Meal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meal_type">Meal Type *</Label>
                    <Select
                      value={formData.meal_type}
                      onValueChange={(value) => setFormData({ ...formData, meal_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meal_name">Meal Name *</Label>
                    <Input
                      id="meal_name"
                      value={formData.meal_name}
                      onChange={(e) => setFormData({ ...formData, meal_name: e.target.value })}
                      required
                      placeholder="e.g., Chicken Salad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories *</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                      required
                      placeholder="450"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={formData.protein_g}
                      onChange={(e) => setFormData({ ...formData, protein_g: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={formData.carbs_g}
                      onChange={(e) => setFormData({ ...formData, carbs_g: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      value={formData.fat_g}
                      onChange={(e) => setFormData({ ...formData, fat_g: e.target.value })}
                      placeholder="15"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Add Meal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Daily Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{totalCalories}</p>
                <p className="text-sm text-muted-foreground">Calories</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalProtein}g</p>
                <p className="text-sm text-muted-foreground">Protein</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{totalCarbs}g</p>
                <p className="text-sm text-muted-foreground">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">{totalFat}g</p>
                <p className="text-sm text-muted-foreground">Fat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals List */}
        <div className="grid gap-4">
          {meals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No meals logged today. Start tracking your nutrition!</p>
              </CardContent>
            </Card>
          ) : (
            meals.map((meal) => (
              <Card key={meal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{meal.meal_name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{meal.meal_type}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(meal.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="text-accent">
                      <span className="font-semibold">{meal.calories}</span> cal
                    </div>
                    {meal.protein_g && (
                      <div className="text-primary">
                        <span className="font-semibold">{meal.protein_g}g</span> protein
                      </div>
                    )}
                    {meal.carbs_g && (
                      <div className="text-secondary">
                        <span className="font-semibold">{meal.carbs_g}g</span> carbs
                      </div>
                    )}
                    {meal.fat_g && (
                      <div className="text-warning">
                        <span className="font-semibold">{meal.fat_g}g</span> fat
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Nutrition;
