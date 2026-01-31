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
import { ArrowLeft, Loader2, MapPin, Package } from "lucide-react";

export default function RequestErrand() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [reward, setReward] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to request an errand.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !pickupLocation.trim() || !deliveryLocation.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("errand_requests").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      pickup_location: pickupLocation.trim(),
      delivery_location: deliveryLocation.trim(),
      reward: reward.trim() || null,
    });

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: "create",
      entity_type: "errand_request",
      details: { title: title.trim() },
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
        title: "Errand request posted!",
        description: "Others can now see your request and help you.",
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <Package className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Request Item/Errand</CardTitle>
                <CardDescription>
                  Ask someone to help you with an errand or deliver an item
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">What do you need? *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Pick up my package from mailroom"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Details (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any extra details about your request..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup">Pickup Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pickup"
                    className="pl-9"
                    placeholder="e.g., Student Center, Room 102"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery">Delivery Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="delivery"
                    className="pl-9"
                    placeholder="e.g., Dormitory B, Room 305"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward">Reward/Payment (optional)</Label>
                <Input
                  id="reward"
                  placeholder="e.g., $5, Coffee, Return favor"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Errand Request"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
