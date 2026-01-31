import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, Check, Loader2, MapPin, RefreshCw, Shield } from "lucide-react";

interface EmergencyRequest {
  id: string;
  reason: string;
  location: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  profiles: {
    name: string;
    email: string;
  } | null;
}

const reasonLabels: Record<string, { label: string; icon: string }> = {
  medical: { label: "Medical", icon: "🏥" },
  safety: { label: "Safety", icon: "🛡️" },
  other: { label: "Other", icon: "⚠️" },
};

export default function AdminEmergencies() {
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("emergency_requests")
      .select(`
        id,
        reason,
        location,
        status,
        created_at,
        resolved_at,
        user_id
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const emergenciesWithProfiles = data.map(emergency => ({
        ...emergency,
        profiles: profileMap.get(emergency.user_id) || null
      }));
      
      setEmergencies(emergenciesWithProfiles as EmergencyRequest[]);
    }
    setLoading(false);
  };

  const handleResolve = async (id: string) => {
    if (!user) return;

    setResolvingId(id);

    const { error } = await supabase
      .from("emergency_requests")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq("id", id);

    setResolvingId(null);

    if (error) {
      toast({
        title: "Failed to resolve",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request resolved",
        description: "The emergency request has been marked as resolved.",
      });
      fetchEmergencies();
    }
  };

  const openCount = emergencies.filter((e) => e.status === "open").length;

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

        <Card className="campus-card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive">
                  <Shield className="h-6 w-6 text-destructive-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Emergency Dashboard</CardTitle>
                  <CardDescription>
                    Manage and respond to student emergency requests
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {openCount > 0 && (
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    {openCount} Open
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={fetchEmergencies}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : emergencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No emergency requests</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  All is calm on campus right now.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emergencies.map((emergency) => (
                      <TableRow key={emergency.id}>
                        <TableCell className="font-medium">
                          {emergency.profiles?.name || emergency.profiles?.email?.split("@")[0] || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span>{reasonLabels[emergency.reason]?.icon}</span>
                            {reasonLabels[emergency.reason]?.label || emergency.reason}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {emergency.location}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(emergency.created_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={emergency.status === "open" ? "destructive" : "secondary"}
                          >
                            {emergency.status === "open" ? "Open" : "Resolved"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {emergency.status === "open" ? (
                            <Button
                              size="sm"
                              onClick={() => handleResolve(emergency.id)}
                              disabled={resolvingId === emergency.id}
                            >
                              {resolvingId === emergency.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="mr-1 h-4 w-4" />
                                  Resolve
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {emergency.resolved_at &&
                                format(new Date(emergency.resolved_at), "MMM d, h:mm a")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
