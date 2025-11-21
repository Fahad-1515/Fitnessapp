import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProgressRing from "./ProgressRing";
import { Activity, Utensils, Droplets, Moon, TrendingUp, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LifestyleLog {
  steps: number;
  water_liters: number;
  sleep_hours: number;
  energy_level: number;
}

interface DailyTotals {
  workouts: number;
  calories: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [lifestyleLog, setLifestyleLog] = useState<LifestyleLog>({
    steps: 0,
    water_liters: 0,
    sleep_hours: 0,
    energy_level: 5,
  });
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({
    workouts: 0,
    calories: 0,
  });

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    // Load lifestyle log
    const { data: lifestyle } = await supabase
      .from("lifestyle_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (lifestyle) {
      setLifestyleLog({
        steps: lifestyle.steps || 0,
        water_liters: lifestyle.water_liters || 0,
        sleep_hours: lifestyle.sleep_hours || 0,
        energy_level: lifestyle.energy_level || 5,
      });
    }

    // Load today's workouts
    const { data: workouts } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today);

    // Load today's meals
    const { data: meals } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today);

    setDailyTotals({
      workouts: workouts?.length || 0,
      calories: meals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Your Fitness Dashboard
          </h1>
          <p className="text-muted-foreground">Track your progress and stay motivated</p>
        </div>
        <Button onClick={() => navigate("/ai-coach")} variant="default" size="lg">
          <MessageSquare className="mr-2 h-5 w-5" />
          AI Coach
        </Button>
      </div>

      {/* Progress Rings */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
            <ProgressRing
              value={lifestyleLog.steps}
              max={10000}
              label="Steps"
              color="hsl(var(--primary))"
            />
            <ProgressRing
              value={Math.round(lifestyleLog.water_liters * 10) / 10}
              max={3}
              label="Water (L)"
              color="hsl(var(--secondary))"
            />
            <ProgressRing
              value={dailyTotals.calories}
              max={2000}
              label="Calories"
              color="hsl(var(--accent))"
            />
            <ProgressRing
              value={Math.round(lifestyleLog.sleep_hours * 10) / 10}
              max={8}
              label="Sleep (hrs)"
              color="hsl(var(--success))"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/workouts")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Workouts</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyTotals.workouts}</div>
            <p className="text-xs text-muted-foreground">Today's sessions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/nutrition")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nutrition</CardTitle>
            <Utensils className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyTotals.calories}</div>
            <p className="text-xs text-muted-foreground">Calories consumed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/lifestyle")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hydration</CardTitle>
            <Droplets className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lifestyleLog.water_liters}</div>
            <p className="text-xs text-muted-foreground">Liters today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/lifestyle")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sleep</CardTitle>
            <Moon className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lifestyleLog.sleep_hours}</div>
            <p className="text-xs text-muted-foreground">Hours last night</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20" onClick={() => navigate("/workouts")}>
            <div className="flex flex-col items-center gap-1">
              <Activity className="h-5 w-5" />
              <span>Log Workout</span>
            </div>
          </Button>
          <Button variant="outline" className="h-20" onClick={() => navigate("/nutrition")}>
            <div className="flex flex-col items-center gap-1">
              <Utensils className="h-5 w-5" />
              <span>Add Meal</span>
            </div>
          </Button>
          <Button variant="outline" className="h-20" onClick={() => navigate("/lifestyle")}>
            <div className="flex flex-col items-center gap-1">
              <Droplets className="h-5 w-5" />
              <span>Update Stats</span>
            </div>
          </Button>
          <Button variant="outline" className="h-20" onClick={() => navigate("/profile")}>
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className="h-5 w-5" />
              <span>View Profile</span>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
