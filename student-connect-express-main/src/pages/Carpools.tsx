import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Car,
  Check,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Users,
} from "lucide-react";

interface CarpoolRide {
  id: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  seats_available: number;
  seats_taken: number;
  price_per_seat: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  driver_id: string;
  profiles: {
    name: string;
    email: string;
  } | null;
}

export default function Carpools() {
  const [carpools, setCarpools] = useState<CarpoolRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCarpools();
  }, []);

  const fetchCarpools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("carpool_rides")
      .select(`
        id,
        from_location,
        to_location,
        departure_date,
        departure_time,
        seats_available,
        seats_taken,
        price_per_seat,
        notes,
        status,
        created_at,
        driver_id
      `)
      .order("departure_date", { ascending: true });

    if (!error && data) {
      const driverIds = [...new Set(data.map((c) => c.driver_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", driverIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const carpoolsWithProfiles = data.map((carpool) => ({
        ...carpool,
        profiles: profileMap.get(carpool.driver_id) || null,
      }));

      setCarpools(carpoolsWithProfiles as CarpoolRide[]);
    }
    setLoading(false);
  };

  const handleMarkComplete = async (id: string) => {
    if (!user) return;
    setCompleting(id);

    const { error } = await supabase
      .from("carpool_rides")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: "complete",
      entity_type: "carpool_ride",
      entity_id: id,
    });

    setCompleting(null);

    if (error) {
      toast({ title: "Failed to complete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ride marked as completed!" });
      fetchCarpools();
    }
  };

  const activeRides = carpools.filter((c) => c.status === "active");
  const completedRides = carpools.filter((c) => c.status === "completed");

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
            <h1 className="text-3xl font-bold text-foreground">Carpool Rides</h1>
            <p className="mt-1 text-muted-foreground">Share rides and save on travel costs</p>
          </div>
          <Link to="/carpool">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Offer a Ride
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeRides.length === 0 && completedRides.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Car className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No carpool rides yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to offer a ride!</p>
              <Link to="/carpool" className="mt-4">
                <Button>Offer a Ride</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {activeRides.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">Available Rides</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeRides.map((carpool) => (
                    <Card key={carpool.id} className="campus-card-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              {carpool.from_location}
                              <ArrowRight className="h-4 w-4 text-primary" />
                              {carpool.to_location}
                            </CardTitle>
                            <CardDescription>
                              Driver: {carpool.profiles?.name || carpool.profiles?.email?.split("@")[0] || "Student"}
                            </CardDescription>
                          </div>
                          <Badge variant="default">
                            {carpool.seats_available - carpool.seats_taken} seats
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(carpool.departure_date), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {carpool.departure_time.slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-primary" />
                            {carpool.seats_taken}/{carpool.seats_available} seats taken
                          </span>
                          {carpool.price_per_seat && (
                            <span className="flex items-center gap-1 text-accent-foreground">
                              <DollarSign className="h-4 w-4" />
                              ${carpool.price_per_seat.toFixed(2)}/seat
                            </span>
                          )}
                        </div>
                        {carpool.notes && (
                          <p className="text-sm text-muted-foreground">{carpool.notes}</p>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <a
                              href={getGoogleMapsDirectionsUrl(carpool.from_location, carpool.to_location)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              View Route
                            </a>
                          </Button>
                          {user && carpool.driver_id === user.id && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex-1"
                              onClick={() => handleMarkComplete(carpool.id)}
                              disabled={completing === carpool.id}
                            >
                              {completing === carpool.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="mr-1 h-3 w-3" />
                                  Mark Done
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completedRides.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-muted-foreground">Completed Rides</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedRides.map((carpool) => (
                    <Card key={carpool.id} className="opacity-60">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg line-through">
                            {carpool.from_location}
                            <ArrowRight className="h-4 w-4" />
                            {carpool.to_location}
                          </CardTitle>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(carpool.departure_date), "MMM d")}
                          </span>
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
