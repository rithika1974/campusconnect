import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Car, Loader2, MapPin, Users } from "lucide-react";

export default function Carpool() {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState("1");
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to offer a carpool.",
        variant: "destructive",
      });
      return;
    }

    if (!fromLocation.trim() || !toLocation.trim() || !departureDate || !departureTime) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("carpool_rides").insert({
      driver_id: user.id,
      from_location: fromLocation.trim(),
      to_location: toLocation.trim(),
      departure_date: departureDate,
      departure_time: departureTime,
      seats_available: parseInt(seatsAvailable) || 1,
      price_per_seat: pricePerSeat ? parseFloat(pricePerSeat) : null,
      notes: notes.trim() || null,
    });

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: "create",
      entity_type: "carpool_ride",
      details: { from: fromLocation.trim(), to: toLocation.trim() },
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Failed to submit",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Carpool ride posted!",
        description: "Others can now see your ride and request to join.",
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="mx-auto max-w-xl campus-card-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Car className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Offer a Carpool Ride</CardTitle>
                <CardDescription>
                  Share your ride and help fellow students save on travel
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from">From *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="from"
                      className="pl-9"
                      placeholder="Starting location"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to">To *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="to"
                      className="pl-9"
                      placeholder="Destination"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Departure Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Departure Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="seats">Seats Available *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="seats"
                      type="number"
                      className="pl-9"
                      min="1"
                      max="7"
                      value={seatsAvailable}
                      onChange={(e) => setSeatsAvailable(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price per Seat (optional)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.50"
                    min="0"
                    placeholder="$0.00"
                    value={pricePerSeat}
                    onChange={(e) => setPricePerSeat(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Leaving from parking lot B, no smoking..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Carpool Ride"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
