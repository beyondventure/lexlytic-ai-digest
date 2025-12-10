import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CBNPortal from "./pages/CBNPortal";
import Rulebook from "./pages/Rulebook";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import DocumentUpload from "./pages/DocumentUpload";
import Features from "./pages/Features";
import Chat from "./pages/Chat";
import Comparison from "./pages/Comparison";
import Risk from "./pages/Risk";
import AlertSettings from "./pages/AlertSettings";
import Translate from "./pages/Translate";
import DocumentDetail from "./pages/DocumentDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Features />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          
          {/* Authenticated routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/upload" element={<DocumentUpload />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/risk" element={<Risk />} />
          <Route path="/alerts-settings" element={<AlertSettings />} />
          <Route path="/translate" element={<Translate />} />
          
          {/* CBN Portal routes */}
          <Route path="/cbn-portal" element={<CBNPortal />} />
          <Route path="/cbn-portal/rulebook" element={<Rulebook />} />
          <Route path="/cbn-portal/alerts" element={<Alerts />} />
          <Route path="/cbn-portal/reports" element={<Reports />} />
          
          {/* Legacy routes - redirect to CBN portal */}
          <Route path="/rulebook" element={<Rulebook />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
