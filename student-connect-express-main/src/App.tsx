import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PostTravel from "./pages/PostTravel";
import EmergencyHelp from "./pages/EmergencyHelp";
import AdminEmergencies from "./pages/AdminEmergencies";
import RequestErrand from "./pages/RequestErrand";
import Errands from "./pages/Errands";
import Carpool from "./pages/Carpool";
import Carpools from "./pages/Carpools";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            } />
            <Route path="/register" element={
              <AuthRedirect>
                <Register />
              </AuthRedirect>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/post-travel" element={
              <ProtectedRoute>
                <PostTravel />
              </ProtectedRoute>
            } />
            <Route path="/emergency" element={
              <ProtectedRoute>
                <EmergencyHelp />
              </ProtectedRoute>
            } />
            <Route path="/request-errand" element={
              <ProtectedRoute>
                <RequestErrand />
              </ProtectedRoute>
            } />
            <Route path="/errands" element={
              <ProtectedRoute>
                <Errands />
              </ProtectedRoute>
            } />
            <Route path="/carpool" element={
              <ProtectedRoute>
                <Carpool />
              </ProtectedRoute>
            } />
            <Route path="/carpools" element={
              <ProtectedRoute>
                <Carpools />
              </ProtectedRoute>
            } />
            <Route path="/admin/emergencies" element={
              <ProtectedRoute requireAdmin>
                <AdminEmergencies />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
