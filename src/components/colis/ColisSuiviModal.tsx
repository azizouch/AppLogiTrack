import React, { useState, useEffect } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { HistoriqueColis, Colis, Statut } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatDateTime, getActionParLabel, renderInformations, getEtatBadgeClass } from './colisUtils.tsx';

interface ColisSuiviModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colis: Colis | null;
  statuts: Statut[];
}

export function ColisSuiviModal({ open, onOpenChange, colis, statuts }: ColisSuiviModalProps) {
  const [suiviHistory, setSuiviHistory] = useState<HistoriqueColis[]>([]);
  const [loadingSuivi, setLoadingSuivi] = useState(false);
  const [selectedColisEtat, setSelectedColisEtat] = useState('Non Payé');

  useEffect(() => {
    if (open && colis) {
      fetchSuiviHistory();
    }
  }, [open, colis]);

  const fetchSuiviHistory = async () => {
    if (!colis) return;

    setLoadingSuivi(true);
    try {
      const [historyResult, bonResult] = await Promise.all([
        supabase
          .from('historique_colis')
          .select(`
            id,
            colis_id,
            date,
            statut,
            utilisateur,
            informations,
            user:utilisateurs(role, nom, prenom)
          `)
          .eq('colis_id', colis.id)
          .order('date', { ascending: false }),
        supabase
          .from('bon_colis')
          .select('bon:bons(type, statut)')
          .eq('colis_id', colis.id),
      ]);

      if (historyResult.error) {
        console.error('Error fetching suivi history:', historyResult.error);
        setSuiviHistory([]);
      } else {
        const historyData: HistoriqueColis[] = (historyResult.data || []).map((item: any) => ({
          ...item,
          user: Array.isArray(item.user) ? item.user[0] : item.user,
        }));
        setSuiviHistory(historyData);
      }

      if (bonResult.error) {
        console.error('Error fetching colis payment state:', bonResult.error);
        setSelectedColisEtat('Non Payé');
      } else {
        const hasPaidBon = (bonResult.data || []).some((entry: any) => {
          const bonType = entry?.bon?.type?.toLowerCase();
          const bonStatut = entry?.bon?.statut?.toLowerCase();
          return bonType === 'paiement' && ['complété', 'complete', 'payé', 'paye', 'paid'].includes(bonStatut);
        });

        setSelectedColisEtat(hasPaidBon ? 'Payé' : 'Non Payé');
      }
    } catch (error) {
      console.error('Error fetching suivi history:', error);
      setSuiviHistory([]);
      setSelectedColisEtat('Non Payé');
    } finally {
      setLoadingSuivi(false);
    }
  };

  if (!colis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5" />
            Détails du suivi
          </DialogTitle>
          <DialogDescription>
            Historique des statuts et actions liées au colis {colis.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-4 py-3 px-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 shadow-lg dark:border-gray-800 p-4 lg:p-3 bg-white dark:bg-slate-950">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Code d'envoi</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-all">{colis.id}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 shadow-lg dark:border-gray-800 p-4 lg:p-3  bg-white dark:bg-slate-950">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Client</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{colis.client?.nom || 'N/A'}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 shadow-lg dark:border-gray-800 p-3  bg-white dark:bg-slate-950">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">État du colis</h3>
                <div className="inline-flex items-center gap-2">
                  <Badge className={`${getEtatBadgeClass(selectedColisEtat)} text-xs py-1 px-2 hover:bg-transparent`}>{selectedColisEtat}</Badge>
                </div>
              </div>
            </div>

            {loadingSuivi ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2 text-sm">Chargement du suivi...</p>
              </div>
            ) : suiviHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 sm:p-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Aucun historique de suivi disponible pour ce colis.
              </div>
            ) : (
              <div>
                <div className="space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-6 gap-1 sm:gap-4 items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-950 px-1 sm:px-4 py-1 sm:py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Code d'envoi</span>
                    <span>État</span>
                    <span>Status</span>
                    <span>Date</span>
                    <span>Informations</span>
                    <span>Action</span>
                  </div>
                  <div className="space-y-2">
                    {suiviHistory.map((item) => (
                      <div key={item.id} className="border rounded-xl shadow-md dark:border-gray-800 bg-white dark:bg-slate-950 dark:shadow-sm p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <div className="block sm:hidden space-y-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Code d'envoi</div>
                              <div className="font-medium break-all">{item.colis_id || colis.id || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Date</div>
                              <div className="text-muted-foreground">{formatDateTime(item.date)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">État</div>
                              <Badge className={`${getEtatBadgeClass(selectedColisEtat)} text-xs py-1 px-2 hover:bg-transparent`}>{selectedColisEtat}</Badge>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Status</div>
                              <div><StatusBadge statut={item.statut} statuts={statuts} /></div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Infos</div>
                              <div>{renderInformations(item.informations)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Action par</div>
                              <div className="font-medium">{getActionParLabel(item)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-6 gap-1 sm:gap-4 items-center">
                          <span className="font-medium break-all">{item.colis_id || colis.id || 'N/A'}</span>
                          <Badge className={`${getEtatBadgeClass(selectedColisEtat)} text-xs py-1 px-2 hover:bg-transparent`}>{selectedColisEtat}</Badge>
                          <div className="flex items-center justify-start"><StatusBadge statut={item.statut} statuts={statuts} /></div>
                          <span className="text-muted-foreground">{formatDateTime(item.date)}</span>
                          <div>{renderInformations(item.informations)}</div>
                          <span className="font-medium truncate">{getActionParLabel(item)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}