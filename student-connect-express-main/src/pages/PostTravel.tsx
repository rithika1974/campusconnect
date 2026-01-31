import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Loader2, MapPin, ArrowLeft, Bus, Bike, Footprints, Car } from "lucide-react";
import { cn } from "@/lib/utils";

const travelPostSchema = z.object({
  from_location: z.string().min(2, "Location must be at least 2 characters").max(100),
  to_location: z.string().min(2, "Location must be at least 2 characters").max(100),
  travel_date: z.date({ required_error: "Please select a date" }),
  travel_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time"),
  mode: z.enum(["bus", "bike", "walk", "car"]),
});

type TravelPostFormData = z.infer<typeof travelPostSchema>;

const transportModes = [
  { value: "bus", label: "Bus", icon: Bus },
  { value: "bike", label: "Bike", icon: Bike },
  { value: "walk", label: "Walk", icon: Footprints },
  { value: "car", label: "Car", icon: Car },
];

export default function PostTravel() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<TravelPostFormData>({
    resolver: zodResolver(travelPostSchema),
    defaultValues: {
      from_location: "",
      to_location: "",
      travel_time: "",
      mode: "bus",
    },
  });

  const onSubmit = async (data: TravelPostFormData) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to post travel.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { data: insertData, error } = await supabase.from("travel_posts").insert({
      user_id: user.id,
      from_location: data.from_location,
      to_location: data.to_location,
      travel_date: format(data.travel_date, "yyyy-MM-dd"),
      travel_time: data.travel_time,
      mode: data.mode,
    }).select().single();

    // Log activity
    if (!error && insertData) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action_type: "create",
        entity_type: "travel_post",
        entity_id: insertData.id,
        details: { from: data.from_location, to: data.to_location },
      });
    }

    setIsLoading(false);

    if (error) {
      toast({
        title: "Failed to post travel",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Travel posted!",
        description: "Your travel plan has been shared with the campus.",
      });
      navigate("/");
    }
  };

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

        <Card className="campus-card-shadow">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg campus-gradient">
              <MapPin className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Post Your Travel</CardTitle>
            <CardDescription>
              Share your travel plans so others can coordinate or join you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="from_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Main Library" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="to_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Science Building" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="travel_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-popover" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="travel_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transport Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select transport mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {transportModes.map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>
                              <div className="flex items-center gap-2">
                                <mode.icon className="h-4 w-4" />
                                {mode.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post Travel"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
