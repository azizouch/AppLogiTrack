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
import { ViewColis } from "@/pages/colis/ViewColis";
import { UpdateColis } from "@/pages/colis/UpdateColis";
import { ColisLivres } from "@/pages/colis/ColisLivres";
import { ColisRefuses } from "@/pages/colis/ColisRefuses";
import { ColisAnnules } from "@/pages/colis/ColisAnnules";
import { AddColis } from "@/pages/colis/AddColis";
import { MesColis } from "@/pages/colis/MesColis";
import { MesColisLivres } from "@/pages/colis/MesColisLivres";
import { MesColisRefuses } from "@/pages/colis/MesColisRefuses";
import { MesColisAnnules } from "@/pages/colis/MesColisAnnules";
import { ColisRelance } from "@/pages/colis/ColisRelance";
import { RelanceAutreClient } from "@/pages/colis/RelanceAutreClient";
import { FilteredColisView } from "@/pages/colis/FilteredColisView";
import { MesFilteredColisView } from "@/pages/colis/MesFilteredColisView";
import { Profile } from "@/pages/profile/Profile";
import { Settings } from "@/pages/profile/Settings";
import { Distribution } from "@/pages/bons/Distribution";
import { BonDetails } from "@/pages/bons/BonDetails";
import { Paiement } from "@/pages/bons/Paiement";
import { Retour } from "@/pages/bons/Retour";
import { MesDistribution } from "@/pages/bons/MesDistribution";
import { MesPaiement } from "@/pages/bons/MesPaiement";
import { MesRetour } from "@/pages/bons/MesRetour";
import { AllLivreurDistribution } from "@/pages/bons/AllLivreurDistribution";
import { AllLivreurPaiement } from "@/pages/bons/AllLivreurPaiement";
import { AllLivreurRetour } from "@/pages/bons/AllLivreurRetour";
import { Clients } from "@/pages/Clients";
import { AddClient } from "@/pages/clients/AddClient";
import { ClientDetails } from "@/pages/clients/ClientDetails";
import { EditClient } from "@/pages/clients/EditClient";
import { Entreprises } from "@/pages/Entreprises";
import { AddEntreprise } from "@/pages/entreprises/AddEntreprise";
import { EntrepriseDetails } from "@/pages/entreprises/EntrepriseDetails";
import { EditEntreprise } from "@/pages/entreprises/EditEntreprise";
import { Livreurs } from "@/pages/Livreurs";
import { AddLivreur } from "@/pages/livreurs/AddLivreur";
import { LivreurDetails } from "@/pages/livreurs/LivreurDetails";
import { EditLivreur } from "@/pages/livreurs/EditLivreur";
import { Notifications } from "@/pages/Notifications";
import { Gestion } from "@/pages/utilisateurs/Gestion";
import { Suivi } from "@/pages/utilisateurs/Suivi";
import { General } from "@/pages/parametres/General";
import { Statuts } from "@/pages/parametres/Statuts";
import { ResetPassword } from "@/pages/auth/ResetPassword";
import { BonRedirector } from "@/components/BonRedirector";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Colis Routes */}
          <Route path="/colis" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <ColisList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/ajouter" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <AddColis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/:id" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <ViewColis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/:id/modifier" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <UpdateColis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/livres" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <ColisLivres />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/refuses" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <ColisRefuses />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/annules" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <ColisAnnules />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/filtered" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <FilteredColisView />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Livreur Colis Routes */}
          <Route path="/colis/mes-colis" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesColis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/mes-livres" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesColisLivres />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/mes-refuses" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesColisRefuses />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/mes-annules" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesColisAnnules />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/mes-filtered" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesFilteredColisView />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/relance" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <ColisRelance />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/colis/relance-autre" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <RelanceAutreClient />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Bons Routes - Smart Redirector (role-based) */}
          <Route path="/bons/distribution" element={
            <ProtectedRoute>
              <BonRedirector bonType="distribution" />
            </ProtectedRoute>
          } />
          <Route path="/bons/distribution/:id" element={
            <ProtectedRoute>
              <Layout>
                <BonDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/bons/paiement" element={
            <ProtectedRoute>
              <BonRedirector bonType="paiement" />
            </ProtectedRoute>
          } />
          <Route path="/bons/paiement/:id" element={
            <ProtectedRoute>
              <Layout>
                <BonDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/bons/retour" element={
            <ProtectedRoute>
              <BonRedirector bonType="retour" />
            </ProtectedRoute>
          } />
          <Route path="/bons/retour/:id" element={
            <ProtectedRoute>
              <Layout>
                <BonDetails />
              </Layout>
            </ProtectedRoute>
          } />
          {/* Livreur-specific bons pages */}
          <Route path="/bons/mes-distribution" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesDistribution />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/bons/mes-distribution/:id" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <BonDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/bons/mes-paiement" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesPaiement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/bons/mes-paiement/:id" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <BonDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/bons/mes-retour" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesRetour />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreur/bons/distribution" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesDistribution />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreur/bons/paiement" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesPaiement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreur/bons/retour" element={
            <ProtectedRoute roles={["Livreur"]}>
              <Layout>
                <MesRetour />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/bons/admin/distribution" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <Distribution />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/bons/admin/paiement" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <Paiement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/bons/admin/retour" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <Retour />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/bons/livreurs/distribution" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <AllLivreurDistribution />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/bons/livreurs/paiement" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <AllLivreurPaiement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/bons/livreurs/retour" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <AllLivreurRetour />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Other Routes - Admin/Gestionnaire Only */}
          <Route path="/clients" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <Clients />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/clients/nouveau" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <AddClient />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/clients/:id" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <ClientDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/clients/:id/modifier" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <EditClient />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/entreprises" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <Entreprises />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/entreprises/ajouter" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <AddEntreprise />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/entreprises/:id" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <EntrepriseDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/entreprises/:id/modifier" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <EditEntreprise />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreurs" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <Livreurs />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreurs/ajouter" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <AddLivreur />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreurs/:id" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <LivreurDetails />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/livreurs/:id/modifier" element={
            <ProtectedRoute roles={["Admin", "Gestionnaire"]}>
              <Layout>
                <EditLivreur />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Shared Routes - All authenticated users */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Only Routes */}
          <Route path="/utilisateurs" element={
            <ProtectedRoute roles={["Admin"]}>
              <Layout>
                <Gestion />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/utilisateurs/suivi" element={
            <ProtectedRoute roles={["Admin"]}>
              <Layout>
                <Suivi />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Paramètres Routes - Admin Only */}
          <Route path="/parametres" element={
            <ProtectedRoute roles={["Admin"]}>
              <Layout>
                <General />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/parametres/statuts" element={
            <ProtectedRoute roles={["Admin"]}>
              <Layout>
                <Statuts />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Profile Routes - All authenticated users */}
          <Route path="/profil" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/parametres/compte" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;