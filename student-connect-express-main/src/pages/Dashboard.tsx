import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps";
import { 
  MapPin, 
  Package, 
  Car, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  Calendar,
  Bus,
  Bike,
  Footprints,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface TravelPost {
  id: string;
  from_location: string;
  to_location: string;
  travel_date: string;
  travel_time: string;
  mode: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  } | null;
}

const getModeIcon = (mode: string) => {
  switch (mode) {
    case "bus": return <Bus className="h-4 w-4" />;
    case "bike": return <Bike className="h-4 w-4" />;
    case "walk": return <Footprints className="h-4 w-4" />;
    case "car": return <Car className="h-4 w-4" />;
    default: return <MapPin className="h-4 w-4" />;
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [travelPosts, setTravelPosts] = useState<TravelPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTravelPosts();
  }, []);

  const fetchTravelPosts = async () => {
    const { data, error } = await supabase
      .from("travel_posts")
      .select(`
        id,
        from_location,
        to_location,
        travel_date,
        travel_time,
        mode,
        created_at,
        user_id
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const postsWithProfiles = data.map(post => ({
        ...post,
        profiles: profileMap.get(post.user_id) || null
      }));
      
      setTravelPosts(postsWithProfiles as TravelPost[]);
    }
    setLoading(false);
  };

  const actionCards = [
    {
      title: "Post Travel",
      description: "Share your travel plans with others",
      icon: MapPin,
      href: "/post-travel",
      active: true,
      color: "bg-primary",
    },
    {
      title: "Request Item/Errand",
      description: "Ask for help with errands",
      icon: Package,
      href: "/errands",
      active: true,
      color: "bg-secondary",
    },
    {
      title: "Carpool",
      description: "Find or offer rides",
      icon: Car,
      href: "/carpools",
      active: true,
      color: "bg-accent",
    },
    {
      title: "Emergency Help",
      description: "Request urgent assistance",
      icon: AlertTriangle,
      href: "/emergency",
      active: true,
      color: "bg-destructive",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            What would you like to do today?
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actionCards.map((card) => (
            <Card
              key={card.title}
              className={`relative overflow-hidden transition-all ${
                card.active 
                  ? "cursor-pointer hover:shadow-lg hover:-translate-y-1" 
                  : "opacity-60"
              }`}
            >
              {card.active ? (
                <Link to={card.href} className="block">
                  <CardHeader className="pb-2">
                    <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
                      <card.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="inline-flex items-center text-sm font-medium text-primary">
                      Get started <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </CardContent>
                </Link>
              ) : (
                <>
                  <CardHeader className="pb-2">
                    <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
                      <card.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="secondary">Coming Soon</Badge>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>

        {/* Activity Feed */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Recent Travel Posts</h2>
            <Link to="/post-travel">
              <Button variant="outline" size="sm">
                Post Your Travel
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
                    <div className="mt-4 h-8 w-full rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : travelPosts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-medium">No travel posts yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Be the first to share your travel plans!
                </p>
                <Link to="/post-travel" className="mt-4">
                  <Button>Post Travel</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {travelPosts.map((post) => (
                <Card key={post.id} className="campus-card-shadow hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {post.profiles?.name || post.profiles?.email?.split("@")[0] || "Student"}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-foreground">
                          <span className="font-medium">{post.from_location}</span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="font-medium">{post.to_location}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getModeIcon(post.mode)}
                        {post.mode}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(post.travel_date), "MMM d")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.travel_time.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        View / Help
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={getGoogleMapsDirectionsUrl(post.from_location, post.to_location)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
