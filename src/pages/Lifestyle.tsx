import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TrendingUp, Droplets, Moon, Heart, Activity } from "lucide-react";
import Layout from "@/components/Layout";
import { z } from "zod";

const lifestyleSchema = z.object({
  steps: z.number().int().min(0, "Steps cannot be negative").max(100000, "Steps cannot exceed 100,000"),
  water_liters: z.number().min(0, "Water intake cannot be negative").max(20, "Water intake cannot exceed 20 liters"),
  sleep_hours: z.number().min(0, "Sleep hours cannot be negative").max(24, "Sleep hours cannot exceed 24"),
  sleep_quality: z.string().nullable(),
  stress_level: z.number().int().min(1, "Stress level must be between 1-10").max(10, "Stress level must be between 1-10").nullable(),
  energy_level: z.number().int().min(1, "Energy level must be between 1-10").max(10, "Energy level must be between 1-10").nullable(),
});

const Lifestyle = () => {
  const [formData, setFormData] = useState({
    steps: "0",
    water_liters: "0",
    sleep_hours: "0",
    sleep_quality: "average",
    stress_level: "5",
    energy_level: "5",
  });

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("lifestyle_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (data) {
      setFormData({
        steps: data.steps?.toString() || "0",
        water_liters: data.water_liters?.toString() || "0",
        sleep_hours: data.sleep_hours?.toString() || "0",
        sleep_quality: data.sleep_quality || "average",
        stress_level: data.stress_level?.toString() || "5",
        energy_level: data.energy_level?.toString() || "5",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Validate input data
      const validatedData = lifestyleSchema.parse({
        steps: parseInt(formData.steps) || 0,
        water_liters: parseFloat(formData.water_liters) || 0,
        sleep_hours: parseFloat(formData.sleep_hours) || 0,
        sleep_quality: formData.sleep_quality || null,
        stress_level: formData.stress_level ? parseInt(formData.stress_level) : null,
        energy_level: formData.energy_level ? parseInt(formData.energy_level) : null,
      });

      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("lifestyle_logs").upsert({
        user_id: user.id,
        date: today,
        steps: validatedData.steps,
        water_liters: validatedData.water_liters,
        sleep_hours: validatedData.sleep_hours,
        sleep_quality: validatedData.sleep_quality,
        stress_level: validatedData.stress_level,
        energy_level: validatedData.energy_level,
      }, {
        onConflict: "user_id,date"
      });

      if (error) {
        toast.error("Failed to update lifestyle data");
        console.error(error);
        return;
      }

      toast.success("Lifestyle data updated successfully!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to update lifestyle data");
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-success" />
            Lifestyle Tracking
          </h1>
          <p className="text-muted-foreground">Monitor your daily habits and wellness</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Daily Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="steps">Steps</Label>
                  <Input
                    id="steps"
                    type="number"
                    value={formData.steps}
                    onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                    placeholder="10000"
                  />
                  <p className="text-xs text-muted-foreground">Target: 10,000 steps per day</p>
                </div>
              </CardContent>
            </Card>

            {/* Hydration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Droplets className="h-5 w-5 text-secondary" />
                  Hydration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="water">Water (liters)</Label>
                  <Input
                    id="water"
                    type="number"
                    step="0.1"
                    value={formData.water_liters}
                    onChange={(e) => setFormData({ ...formData, water_liters: e.target.value })}
                    placeholder="2.5"
                  />
                  <p className="text-xs text-muted-foreground">Target: 2-3 liters per day</p>
                </div>
              </CardContent>
            </Card>

            {/* Sleep */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Moon className="h-5 w-5 text-success" />
                  Sleep
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sleep_hours">Sleep Hours</Label>
                  <Input
                    id="sleep_hours"
                    type="number"
                    step="0.5"
                    value={formData.sleep_hours}
                    onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
                    placeholder="7.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleep_quality">Sleep Quality</Label>
                  <Select
                    value={formData.sleep_quality}
                    onValueChange={(value) => setFormData({ ...formData, sleep_quality: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Well-being */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-accent" />
                  Well-being
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stress">Stress Level (1-10)</Label>
                  <Input
                    id="stress"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.stress_level}
                    onChange={(e) => setFormData({ ...formData, stress_level: e.target.value })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Relaxed (1)</span>
                    <span>Very Stressed (10)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="energy">Energy Level (1-10)</Label>
                  <Input
                    id="energy"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.energy_level}
                    onChange={(e) => setFormData({ ...formData, energy_level: e.target.value })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Exhausted (1)</span>
                    <span>Energized (10)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button type="submit" size="lg" className="w-full md:w-auto">
            Save Lifestyle Data
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default Lifestyle;
