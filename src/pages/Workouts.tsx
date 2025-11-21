import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Dumbbell } from "lucide-react";
import Layout from "@/components/Layout";
import { z } from "zod";

const workoutSchema = z.object({
  exercise_name: z.string().trim().min(1, "Exercise name is required").max(100, "Exercise name must be less than 100 characters"),
  sets: z.number().int().min(1, "Sets must be at least 1").max(50, "Sets cannot exceed 50").nullable(),
  reps: z.number().int().min(1, "Reps must be at least 1").max(500, "Reps cannot exceed 500").nullable(),
  duration_minutes: z.number().int().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 480 minutes").nullable(),
  distance_km: z.number().min(0.1, "Distance must be at least 0.1 km").max(500, "Distance cannot exceed 500 km").nullable(),
  calories_burned: z.number().int().min(0, "Calories cannot be negative").max(5000, "Calories cannot exceed 5000").nullable(),
  muscle_group: z.string().max(50, "Muscle group must be less than 50 characters").nullable(),
});

interface Workout {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  duration_minutes: number | null;
  distance_km: number | null;
  muscle_group: string | null;
  calories_burned: number | null;
  date: string;
}

const Workouts = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    exercise_name: "",
    sets: "",
    reps: "",
    duration_minutes: "",
    distance_km: "",
    muscle_group: "",
    calories_burned: "",
  });

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load workouts");
      return;
    }

    setWorkouts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Validate input data
      const validatedData = workoutSchema.parse({
        exercise_name: formData.exercise_name,
        sets: formData.sets ? parseInt(formData.sets) : null,
        reps: formData.reps ? parseInt(formData.reps) : null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        distance_km: formData.distance_km ? parseFloat(formData.distance_km) : null,
        calories_burned: formData.calories_burned ? parseInt(formData.calories_burned) : null,
        muscle_group: formData.muscle_group || null,
      });

      const { error } = await supabase.from("workouts").insert({
        user_id: user.id,
        exercise_name: validatedData.exercise_name,
        sets: validatedData.sets,
        reps: validatedData.reps,
        duration_minutes: validatedData.duration_minutes,
        distance_km: validatedData.distance_km,
        calories_burned: validatedData.calories_burned,
        muscle_group: validatedData.muscle_group,
      });

      if (error) {
        toast.error("Failed to add workout");
        console.error(error);
        return;
      }

      toast.success("Workout added successfully!");
      setFormData({
        exercise_name: "",
        sets: "",
        reps: "",
        duration_minutes: "",
        distance_km: "",
        muscle_group: "",
        calories_burned: "",
      });
      setOpen(false);
      loadWorkouts();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to add workout");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete workout");
      return;
    }

    toast.success("Workout deleted");
    loadWorkouts();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              Workouts
            </h1>
            <p className="text-muted-foreground">Track your exercise sessions</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Workout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Workout</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exercise_name">Exercise Name *</Label>
                    <Input
                      id="exercise_name"
                      value={formData.exercise_name}
                      onChange={(e) => setFormData({ ...formData, exercise_name: e.target.value })}
                      required
                      placeholder="e.g., Bench Press"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="muscle_group">Muscle Group</Label>
                    <Input
                      id="muscle_group"
                      value={formData.muscle_group}
                      onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
                      placeholder="e.g., Chest"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sets">Sets</Label>
                    <Input
                      id="sets"
                      type="number"
                      value={formData.sets}
                      onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reps">Reps</Label>
                    <Input
                      id="reps"
                      type="number"
                      value={formData.reps}
                      onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distance (km)</Label>
                    <Input
                      id="distance"
                      type="number"
                      step="0.1"
                      value={formData.distance_km}
                      onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                      placeholder="5.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories Burned</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={formData.calories_burned}
                      onChange={(e) => setFormData({ ...formData, calories_burned: e.target.value })}
                      placeholder="250"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Add Workout</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workouts List */}
        <div className="grid gap-4">
          {workouts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No workouts logged today. Start by adding one!</p>
              </CardContent>
            </Card>
          ) : (
            workouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{workout.exercise_name}</CardTitle>
                    {workout.muscle_group && (
                      <p className="text-sm text-muted-foreground">{workout.muscle_group}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(workout.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {workout.sets && workout.reps && (
                      <div>
                        <span className="font-semibold">{workout.sets}</span> sets ×{" "}
                        <span className="font-semibold">{workout.reps}</span> reps
                      </div>
                    )}
                    {workout.duration_minutes && (
                      <div>
                        <span className="font-semibold">{workout.duration_minutes}</span> minutes
                      </div>
                    )}
                    {workout.distance_km && (
                      <div>
                        <span className="font-semibold">{workout.distance_km}</span> km
                      </div>
                    )}
                    {workout.calories_burned && (
                      <div className="text-accent">
                        <span className="font-semibold">{workout.calories_burned}</span> calories
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

export default Workouts;
