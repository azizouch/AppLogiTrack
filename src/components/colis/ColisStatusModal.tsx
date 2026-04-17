import React, { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { api, supabase } from '@/lib/supabase';
import { Colis, Statut } from '@/types';
import { formatDate } from './colisUtils';

interface ColisStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colis: Colis | null;
  statuts: Statut[];
  onStatusUpdated?: () => void;
}

const getMinDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function ColisStatusModal({
  open,
  onOpenChange,
  colis,
  statuts,
  onStatusUpdated
}: ColisStatusModalProps) {
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open && colis) {
      setNewStatus(colis.statut || '');
      setStatusNote('');
      setReportDate('');
    }
  }, [open, colis]);

  const updateColisStatus = async () => {
    if (!colis || !newStatus) return;

    setIsUpdating(true);
    try {
      // Update colis status
      if (newStatus === 'Reporté' && !reportDate) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner une date de report.',
          variant: 'destructive',
        });
        setIsUpdating(false);
        return;
      }

      // Validate that the date is not in the past
      if (newStatus === 'Reporté' && reportDate) {
        const selectedDate = new Date(reportDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          toast({
            title: 'Erreur',
            description: 'Vous ne pouvez pas sélectionner une date passée. Veuillez choisir une date à partir d\'aujourd\'hui.',
            variant: 'destructive',
          });
          setIsUpdating(false);
          return;
        }
      }

      // Check if status is staying "Reporté" and date is being changed
      const isStatusUnchanged = colis.statut === newStatus;
      const isReportDateChanged = newStatus === 'Reporté' && reportDate && colis.statut === 'Reporté';

      // Only update the colis status if it's actually changing
      if (!isStatusUnchanged) {
        const { error } = await api.updateColis(colis.id, {
          statut: newStatus,
          date_mise_a_jour: new Date().toISOString()
        });

        if (error) {
          toast({
            title: 'Erreur',
            description: 'Impossible de mettre à jour le statut',
            variant: 'destructive',
          });
          return;
        }
      }

      // Get current user for historique
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      // Find the corresponding utilisateur record using the auth_id field
      let utilisateurId = null;
      if (currentUserId) {
        const { data: utilisateur, error: userError } = await supabase
          .from('utilisateurs')
          .select('id, nom, prenom, role, auth_id')
          .eq('auth_id', currentUserId)
          .maybeSingle();

        if (!userError && utilisateur) {
          utilisateurId = utilisateur.id;
        }
      }

      // Add to historique only if we have a valid utilisateur and either status changed or date changed
      if (utilisateurId && (!isStatusUnchanged || isReportDateChanged)) {
        const historiqueEntry: any = {
          colis_id: colis.id,
          statut: newStatus,
          date: new Date().toISOString(),
          utilisateur: utilisateurId
        };

        const noteParts: string[] = [];
        if (newStatus === 'Reporté' && reportDate) {
          noteParts.push(`Reporté pour le ${formatDate(reportDate)}`);
        }
        if (statusNote.trim()) {
          noteParts.push(statusNote.trim());
        }
        if (noteParts.length > 0) {
          historiqueEntry.informations = noteParts.join(' — ');
        }

        const { error: historiqueError } = await supabase
          .from('historique_colis')
          .insert(historiqueEntry);

        if (historiqueError) {
          console.error('Error inserting historique:', historiqueError);
          // Don't throw here - we still want the status update to succeed
          toast({
            title: 'Avertissement',
            description: 'Le statut a été mis à jour mais l\'historique n\'a pas pu être enregistré',
            variant: 'destructive',
          });
        }
      } else {
        console.error('No utilisateur ID found - inserting historique without utilisateur');
        // Try inserting without utilisateur field
        const historiqueEntry: any = {
          colis_id: colis.id,
          statut: newStatus,
          date: new Date().toISOString()
        };

        const noteParts: string[] = [];
        if (newStatus === 'Reporté' && reportDate) {
          noteParts.push(`Reporté pour le ${formatDate(reportDate)}`);
        }
        if (statusNote.trim()) {
          noteParts.push(statusNote.trim());
        }
        if (noteParts.length > 0) {
          historiqueEntry.informations = noteParts.join(' — ');
        }

        const { error: historiqueError } = await supabase
          .from('historique_colis')
          .insert(historiqueEntry);

        if (historiqueError) {
          console.error('Error inserting historique without utilisateur:', historiqueError);
          toast({
            title: 'Avertissement',
            description: 'Le statut a été mis à jour mais l\'historique n\'a pas pu être enregistré (utilisateur non trouvé)',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Succès',
        description: isReportDateChanged ? 'Date de report mise à jour avec succès' : 'Statut mis à jour avec succès',
      });
      onOpenChange(false);
      onStatusUpdated?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Save className="mr-2 h-5 w-5" />
            Changer le statut du colis
          </DialogTitle>
          <DialogDescription>
            Mettre à jour le statut du colis #{colis?.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Statut actuel:</p>
              {colis && (
                <div><StatusBadge statut={colis.statut || 'En attente'} statuts={statuts} /></div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">Nouveau statut</Label>
            <Select
              value={newStatus}
              onValueChange={setNewStatus}
            >
              <SelectTrigger id="newStatus">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent className="centred-popover">
                {statuts && statuts.length > 0 ? (
                  statuts.map((status) => (
                    <SelectItem key={status.id} value={status.nom}>
                      {status.nom}
                    </SelectItem>
                  ))
                ) : (
                  // Fallback options if statuses aren't loaded
                  <>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="Pris en charge">Pris en charge</SelectItem>
                    <SelectItem value="En cours de livraison">En cours de livraison</SelectItem>
                    <SelectItem value="Livré">Livré</SelectItem>
                    <SelectItem value="Refusé">Refusé</SelectItem>
                    <SelectItem value="Annulé">Annulé</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {newStatus === 'Reporté' && (
            <div className="space-y-2">
              <Label htmlFor="reportDate">Date de report</Label>
              <Input
                id="reportDate"
                type="date"
                min={getMinDate()}
                value={reportDate}
                className="dark:bg-slate-900 dark:text-white dark:border-gray-700 dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:brightness-200"
                onChange={(e) => {
                  const selected = new Date(e.target.value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  if (selected < today) {
                    toast({
                      title: 'Erreur',
                      description: 'Vous ne pouvez pas sélectionner une date passée. Veuillez choisir une date à partir d\'aujourd\'hui.',
                      variant: 'destructive',
                    });
                  } else {
                    setReportDate(e.target.value);
                  }
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter className='gap-2'>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={updateColisStatus}
            disabled={isUpdating || newStatus === colis?.statut}
          >
            {isUpdating ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Mettre à jour
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}