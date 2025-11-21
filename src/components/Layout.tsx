import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Home, Activity, Utensils, TrendingUp, MessageSquare, User, LogOut, Dumbbell } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">AI Fitness Coach</h1>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/workouts")}>
              <Activity className="h-4 w-4 mr-2" />
              Workouts
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/nutrition")}>
              <Utensils className="h-4 w-4 mr-2" />
              Nutrition
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/lifestyle")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Lifestyle
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/ai-coach")}>
              <MessageSquare className="h-4 w-4 mr-2" />
              AI Coach
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t py-2">
        <div className="flex justify-around">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/workouts")}>
            <Activity className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/nutrition")}>
            <Utensils className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/ai-coach")}>
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
            <User className="h-5 w-5" />
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
