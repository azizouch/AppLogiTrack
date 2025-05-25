import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { ColisList } from "@/pages/colis/ColisList";
import { ColisLivres } from "@/pages/colis/ColisLivres";
import { ColisRefuses } from "@/pages/colis/ColisRefuses";
import { ColisAnnules } from "@/pages/colis/ColisAnnules";
import { Distribution } from "@/pages/bons/Distribution";
import { Paiement } from "@/pages/bons/Paiement";
import { Retour } from "@/pages/bons/Retour";
import { Clients } from "@/pages/Clients";
import { Entreprises } from "@/pages/Entreprises";
import { Livreurs } from "@/pages/Livreurs";
import { Notifications } from "@/pages/Notifications";
import { Gestion } from "@/pages/utilisateurs/Gestion";
import { Suivi } from "@/pages/utilisateurs/Suivi";
import { General } from "@/pages/parametres/General";
import { Statuts } from "@/pages/parametres/Statuts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />

          {/* Colis Routes */}
          <Route path="/colis" element={
            <Layout>
              <ColisList />
            </Layout>
          } />
          <Route path="/colis/livres" element={
            <Layout>
              <ColisLivres />
            </Layout>
          } />
          <Route path="/colis/refuses" element={
            <Layout>
              <ColisRefuses />
            </Layout>
          } />
          <Route path="/colis/annules" element={
            <Layout>
              <ColisAnnules />
            </Layout>
          } />

          {/* Bons Routes */}
          <Route path="/bons/distribution" element={
            <Layout>
              <Distribution />
            </Layout>
          } />
          <Route path="/bons/paiement" element={
            <Layout>
              <Paiement />
            </Layout>
          } />
          <Route path="/bons/retour" element={
            <Layout>
              <Retour />
            </Layout>
          } />

          {/* Other Routes */}
          <Route path="/clients" element={
            <Layout>
              <Clients />
            </Layout>
          } />
          <Route path="/entreprises" element={
            <Layout>
              <Entreprises />
            </Layout>
          } />
          <Route path="/livreurs" element={
            <Layout>
              <Livreurs />
            </Layout>
          } />
          <Route path="/notifications" element={
            <Layout>
              <Notifications />
            </Layout>
          } />

          {/* Utilisateurs Routes */}
          <Route path="/utilisateurs" element={
            <Layout>
              <Gestion />
            </Layout>
          } />
          <Route path="/utilisateurs/suivi" element={
            <Layout>
              <Suivi />
            </Layout>
          } />

          {/* Paramètres Routes */}
          <Route path="/parametres" element={
            <Layout>
              <General />
            </Layout>
          } />
          <Route path="/parametres/statuts" element={
            <Layout>
              <Statuts />
            </Layout>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;