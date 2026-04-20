import React, { useState, useEffect } from 'react';
import { History, Calendar, User, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface BonHistoryItem {
  id: string;
  bon_id: string;
  type: 'distribution' | 'paiement' | 'retour';
  statut: string;
  notes?: string;
  date: string;
  utilisateur?: string;
  user?: {
    id: string;
    nom: string;
    prenom?: string;
    role: string;
  };
}

interface BonHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bonId: string;
  bonReference: string;
}

export function BonHistoryModal({ open, onOpenChange, bonId, bonReference }: BonHistoryModalProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<BonHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && bonId) {
      fetchBonHistory();
    }
  }, [open, bonId]);

  const fetchBonHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.getBonHistory(bonId);

      if (error) {
        console.error('Error fetching bon history:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger l\'historique du bon',
          variant: 'destructive',
        });
        setHistory([]);
      } else if (data) {
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error in fetchBonHistory:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'en cours':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">En cours</Badge>;
      case 'complété':
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Complété</Badge>;
      case 'annulé':
      case 'annule':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Annulé</Badge>;
      case 'livré':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Livré</Badge>;
      case 'payé':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Payé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'distribution':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Distribution</Badge>;
      case 'paiement':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paiement</Badge>;
      case 'retour':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Retour</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Historique du Bon: {bonReference}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Consultez toutes les modifications et actions effectuées sur ce bon
          </DialogDescription>
        </DialogHeader>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeBadge(item.type)}
                        {getStatusBadge(item.statut)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.date)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      #{index + 1}
                    </div>
                  </div>

                  {item.user && (
                    <div className="flex items-center gap-2 text-sm mb-2 text-gray-700 dark:text-gray-300">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {item.user.nom} {item.user.prenom || ''}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {item.user.role}
                      </span>
                    </div>
                  )}

                  {item.notes && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="break-words whitespace-pre-wrap">{item.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
