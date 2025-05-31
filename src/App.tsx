import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Dashboard } from "@/pages/Dashboard";
import { ColisList } from "@/pages/colis/ColisList";
import { ColisLivres } from "@/pages/colis/ColisLivres";
import { ColisRefuses } from "@/pages/colis/ColisRefuses";
import { ColisAnnules } from "@/pages/colis/ColisAnnules";
import { AddColis } from "@/pages/colis/AddColis";
import { UpdateColis } from "@/pages/colis/UpdateColis";
import { ViewColis } from "@/pages/colis/ViewColis";
import { Distribution } from "@/pages/bons/Distribution";
import { Paiement } from "@/pages/bons/Paiement";
import { Retour } from "@/pages/bons/Retour";
import { Clients } from "@/pages/Clients";
import { AddClient } from "@/pages/clients/AddClient";
import { EditClient } from "@/pages/clients/EditClient";
import { ClientDetails } from "@/pages/clients/ClientDetails";
import { Entreprises } from "@/pages/Entreprises";
import { AddEntreprise } from "@/pages/entreprises/AddEntreprise";
import { EditEntreprise } from "@/pages/entreprises/EditEntreprise";
import { EntrepriseDetails } from "@/pages/entreprises/EntrepriseDetails";
import { Livreurs } from "@/pages/Livreurs";
import { AddLivreur } from "@/pages/livreurs/AddLivreur";
import { EditLivreur } from "@/pages/livreurs/EditLivreur";
import { LivreurDetails } from "@/pages/livreurs/LivreurDetails";
import { Notifications } from "@/pages/Notifications";
import { Gestion } from "@/pages/utilisateurs/Gestion";
import { Suivi } from "@/pages/utilisateurs/Suivi";
import { General } from "@/pages/parametres/General";
import { Statuts } from "@/pages/parametres/Statuts";
import { LoginPage } from "@/components/auth/LoginPage";
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

          {/* Colis Routes */}
          <Route path="/colis" element={
            <ProtectedRoute>
              <Layout>
                <ColisList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/nouveau" element={
            <ProtectedRoute>
              <Layout>
                <AddColis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/:id" element={
            <ProtectedRoute>
              <Layout>
                <ViewColis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/:id/modifier" element={
            <ProtectedRoute>
              <Layout>
                <UpdateColis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/livres" element={
            <ProtectedRoute>
              <Layout>
                <ColisLivres />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/refuses" element={
            <ProtectedRoute>
              <Layout>
                <ColisRefuses />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/annules" element={
            <ProtectedRoute>
              <Layout>
                <ColisAnnules />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Bons Routes */}
          <Route path="/bons/distribution" element={
            <ProtectedRoute>
              <Layout>
                <Distribution />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/bons/paiement" element={
            <ProtectedRoute>
              <Layout>
                <Paiement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/bons/retour" element={
            <ProtectedRoute>
              <Layout>
                <Retour />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Other Routes */}
          <Route path="/clients" element={
            <ProtectedRoute>
              <Layout>
                <Clients />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/clients/nouveau" element={
            <ProtectedRoute>
              <Layout>
                <AddClient />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/clients/:id" element={
            <ProtectedRoute>
              <Layout>
                <ClientDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/clients/:id/modifier" element={
            <ProtectedRoute>
              <Layout>
                <EditClient />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/entreprises" element={
            <ProtectedRoute>
              <Layout>
                <Entreprises />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/entreprises/ajouter" element={
            <ProtectedRoute>
              <Layout>
                <AddEntreprise />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/entreprises/:id" element={
            <ProtectedRoute>
              <Layout>
                <EntrepriseDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/entreprises/:id/modifier" element={
            <ProtectedRoute>
              <Layout>
                <EditEntreprise />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreurs" element={
            <ProtectedRoute>
              <Layout>
                <Livreurs />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreurs/ajouter" element={
            <ProtectedRoute>
              <Layout>
                <AddLivreur />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreurs/:id" element={
            <ProtectedRoute>
              <Layout>
                <LivreurDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreurs/:id/modifier" element={
            <ProtectedRoute>
              <Layout>
                <EditLivreur />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Utilisateurs Routes */}
          <Route path="/utilisateurs" element={
            <ProtectedRoute>
              <Layout>
                <Gestion />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/utilisateurs/suivi" element={
            <ProtectedRoute>
              <Layout>
                <Suivi />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Paramètres Routes */}
          <Route path="/parametres" element={
            <ProtectedRoute>
              <Layout>
                <General />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/parametres/statuts" element={
            <ProtectedRoute>
              <Layout>
                <Statuts />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Login route for testing */}
          <Route path="/login" element={<LoginPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
);

export default App;