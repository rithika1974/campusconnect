import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Gift, Loader2, MapPin, Package, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrandRequest {
  id: string;
  title: string;
  description: string | null;
  pickup_location: string;
  delivery_location: string;
  reward: string | null;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    email: string;
  } | null;
}

export default function Errands() {
  const [errands, setErrands] = useState<ErrandRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchErrands();
  }, []);

  const fetchErrands = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("errand_requests")
      .select(`
        id,
        title,
        description,
        pickup_location,
        delivery_location,
        reward,
        status,
        created_at,
        user_id
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.map((e) => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const errandsWithProfiles = data.map((errand) => ({
        ...errand,
        profiles: profileMap.get(errand.user_id) || null,
      }));

      setErrands(errandsWithProfiles as ErrandRequest[]);
    }
    setLoading(false);
  };

  const handleComplete = async (id: string) => {
    if (!user) return;
    setCompleting(id);

    const { error } = await supabase
      .from("errand_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: user.id,
      })
      .eq("id", id);

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: "complete",
      entity_type: "errand_request",
      entity_id: id,
    });

    setCompleting(null);

    if (error) {
      toast({ title: "Failed to complete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Errand completed!", description: "Thank you for helping out." });
      fetchErrands();
    }
  };

  const openErrands = errands.filter((e) => e.status === "open");
  const completedErrands = errands.filter((e) => e.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Errand Requests</h1>
            <p className="mt-1 text-muted-foreground">Help others or request help with errands</p>
          </div>
          <Link to="/request-errand">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Errand
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : openErrands.length === 0 && completedErrands.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No errand requests yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to request help!</p>
              <Link to="/request-errand" className="mt-4">
                <Button>Request Errand</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {openErrands.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">Open Requests</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {openErrands.map((errand) => (
                    <Card key={errand.id} className="campus-card-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{errand.title}</CardTitle>
                          <Badge variant="default">Open</Badge>
                        </div>
                        <CardDescription>
                          {errand.profiles?.name || errand.profiles?.email?.split("@")[0] || "Student"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {errand.description && (
                          <p className="text-sm text-muted-foreground">{errand.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{errand.pickup_location}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span>{errand.delivery_location}</span>
                        </div>
                        {errand.reward && (
                          <div className="flex items-center gap-2 text-sm text-accent-foreground">
                            <Gift className="h-4 w-4" />
                            <span>Reward: {errand.reward}</span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <a
                              href={getGoogleMapsDirectionsUrl(errand.pickup_location, errand.delivery_location)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Maps
                            </a>
                          </Button>
                          {user && errand.user_id !== user.id && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleComplete(errand.id)}
                              disabled={completing === errand.id}
                            >
                              {completing === errand.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="mr-1 h-3 w-3" />
                                  Help Out
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Posted {format(new Date(errand.created_at), "MMM d, h:mm a")}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completedErrands.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-muted-foreground">Completed</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedErrands.map((errand) => (
                    <Card key={errand.id} className="opacity-60">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-through">{errand.title}</CardTitle>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{errand.pickup_location}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{errand.delivery_location}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
