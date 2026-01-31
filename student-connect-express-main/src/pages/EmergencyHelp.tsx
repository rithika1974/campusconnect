import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ArrowLeft, Loader2, MapPin, Phone, Shield } from "lucide-react";

const emergencySchema = z.object({
  reason: z.enum(["medical", "safety", "other"]),
  location: z.string().min(2, "Please enter your location").max(200),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

const emergencyReasons = [
  { value: "medical", label: "Medical Emergency", icon: "🏥" },
  { value: "safety", label: "Safety Concern", icon: "🛡️" },
  { value: "other", label: "Other Urgent Help", icon: "⚠️" },
];

export default function EmergencyHelp() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<EmergencyFormData>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      reason: "medical",
      location: "",
    },
  });

  const onSubmit = async (data: EmergencyFormData) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to request help.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { data: insertData, error } = await supabase.from("emergency_requests").insert({
      user_id: user.id,
      reason: data.reason,
      location: data.location,
      status: "open",
    }).select().single();

    // Log emergency activity
    if (!error && insertData) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action_type: "create",
        entity_type: "emergency_request",
        entity_id: insertData.id,
        details: { reason: data.reason, location: data.location },
      });
    }

    setIsLoading(false);

    if (error) {
      toast({
        title: "Failed to submit request",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubmitted(true);
      toast({
        title: "Help is on the way!",
        description: "Your emergency request has been submitted.",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-2xl py-8">
          <Card className="campus-card-shadow border-primary">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Help Request Submitted</h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                Your emergency request has been sent to campus security and staff. 
                Help will be dispatched to your location shortly.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate("/")}>
                  Return to Dashboard
                </Button>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Submit Another Request
                </Button>
              </div>
              <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                For immediate danger, also call campus security: (555) 123-4567
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-2xl py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="campus-card-shadow border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive emergency-pulse">
              <AlertTriangle className="h-8 w-8 text-destructive-foreground" />
            </div>
            <CardTitle className="text-2xl">Emergency Help</CardTitle>
            <CardDescription>
              Request urgent assistance from campus security and staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Emergency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select emergency type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {emergencyReasons.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              <div className="flex items-center gap-2">
                                <span>{reason.icon}</span>
                                {reason.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Your Current Location
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Science Building Room 302, or near the fountain" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      REQUEST URGENT HELP
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  <Phone className="inline h-4 w-4 mr-1" />
                  For life-threatening emergencies, call 911 immediately
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
