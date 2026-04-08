import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Colis } from '@/types';
import { api } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ColisReclamationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colis: Colis | null;
}

export function ColisReclamationModal({ open, onOpenChange, colis }: ColisReclamationModalProps) {
  const { state } = useAuth();
  const { toast } = useToast();
  const [reclamationText, setReclamationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!colis || !reclamationText.trim() || !state.user) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Get admin and gestionnaire users to notify
      const { data: adminUsers, error: adminError } = await api.getAdminAndGestionnaireUsers();

      if (adminError) {
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les administrateurs',
          variant: 'destructive',
        });
        return;
      }

      // Create notifications for each admin/gestionnaire
      if (adminUsers && adminUsers.length > 0) {
        const notificationPromises = adminUsers.map(admin =>
          api.createNotification({
            utilisateur_id: admin.id,
            titre: 'Nouvelle réclamation',
            message: `Le livreur ${state.user.prenom} ${state.user.nom} a envoyé une réclamation pour le colis ${colis.id}: "${reclamationText.substring(0, 100)}${reclamationText.length > 100 ? '...' : ''}"`,
            lu: false,
            type: 'reclamation'
          })
        );

        const results = await Promise.all(notificationPromises);

        // Check if any notifications failed
        const failures = results.filter(r => r.error);
        if (failures.length > 0) {
          console.error('Some notifications failed:', failures);
          toast({
            title: 'Réclamation envoyée',
            description: 'Réclamation envoyée mais certaines notifications ont échoué',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Réclamation envoyée',
            description: 'Votre réclamation a été envoyée avec succès',
          });
        }
      } else {
        // No admin users found - let's check what users exist
        const { data: allUsers } = await api.getAdminAndGestionnaireUsers();

        toast({
          title: 'Réclamation envoyée',
          description: 'Réclamation enregistrée (aucun administrateur trouvé)',
        });
      }

      onOpenChange(false);
      setReclamationText('');
    } catch (error) {
      console.error('Error submitting reclamation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la réclamation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReclamationText('');
    }
    onOpenChange(newOpen);
  };

  if (!colis) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Envoyer une réclamation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Colis ID: <span className="font-medium text-foreground">{colis.id}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Client: <span className="font-medium text-foreground">{colis.client?.nom}</span>
            </p>
          </div>
          <Textarea
            placeholder="Décrivez votre réclamation ici..."
            value={reclamationText}
            onChange={(e) => setReclamationText(e.target.value)}
            rows={5}
          />
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!reclamationText.trim() || isSubmitting}>
            <Send className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Envoi...' : 'Envoyer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}