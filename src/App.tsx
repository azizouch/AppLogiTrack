
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { ColisList } from "@/pages/colis/ColisList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/colis" element={
              <ProtectedRoute roles={['admin', 'gestionnaire', 'livreur']}>
                <Layout>
                  <ColisList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/colis/livres" element={
              <ProtectedRoute roles={['admin', 'gestionnaire', 'livreur']}>
                <Layout>
                  <ColisList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/colis/refuses" element={
              <ProtectedRoute roles={['admin', 'gestionnaire']}>
                <Layout>
                  <ColisList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/colis/annules" element={
              <ProtectedRoute roles={['admin', 'gestionnaire']}>
                <Layout>
                  <ColisList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/bons" element={
              <ProtectedRoute roles={['admin', 'gestionnaire']}>
                <Layout>
                  <div>Page Bons - En développement</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute roles={['admin', 'gestionnaire']}>
                <Layout>
                  <div>Page Clients - En développement</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/entreprises" element={
              <ProtectedRoute roles={['admin', 'gestionnaire']}>
                <Layout>
                  <div>Page Entreprises - En développement</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/livreurs" element={
              <ProtectedRoute roles={['admin', 'gestionnaire']}>
                <Layout>
                  <div>Page Livreurs - En développement</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Layout>
                  <div>Page Notifications - En développement</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/utilisateurs" element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <div>Page Utilisateurs - En développement</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/parametres" element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <div>Page Paramètres - En développement</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
