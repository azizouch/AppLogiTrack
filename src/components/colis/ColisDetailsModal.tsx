import React from 'react';
import { Package, Phone, MessageCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colis, Statut } from '@/types';
import { handleWhatsApp, handleSMS, handleCall } from './colisUtils.tsx';

interface ColisDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colis: Colis | null;
  statuts: Statut[];
}

export function ColisDetailsModal({ open, onOpenChange, colis, statuts }: ColisDetailsModalProps) {
  if (!colis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Détails du Colis
          </DialogTitle>
          <DialogDescription>
            Informations complètes sur le colis et options de gestion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Colis Information */}
          <div>
            <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Informations du Colis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">ID Colis</h4>
                <p className="bg-muted p-1 rounded text-xs">{colis.id}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">Date</h4>
                <p>{new Date(colis.date_creation).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">Statut</h4>
                <StatusBadge statut={colis.statut} statuts={statuts} />
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">Prix</h4>
                <p className="font-semibold">{colis.prix || 0} DH</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">Frais</h4>
                <p>{colis.frais > 0 ? `${colis.frais} DH` : 'Aucun'}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">Total</h4>
                <p className="font-bold">{(colis.prix || 0) + (colis.frais || 0)} DH</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Information */}
            <div>
              <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                Client
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Nom</h4>
                  <p>{colis.client?.nom || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Téléphone</h4>
                  <p>{colis.client?.telephone || 'Non disponible'}</p>
                </div>

                {colis.adresse_livraison && colis.adresse_livraison !== '' && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Adresse</h4>
                    <p>{colis.adresse_livraison}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Ville</h4>
                  <p>Casablanca</p>
                </div>

                {colis.client?.telephone && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Contacts</h4>
                    <div className="flex gap-2 mt-1">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleCall(colis)} title="Appeler">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleSMS(colis)} title="SMS">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleWhatsApp(colis)} title="WhatsApp">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Entreprise Information */}
            <div>
              <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                Entreprise
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Nom</h4>
                  <p>{colis.entreprise?.nom !== 'N/A' ? colis.entreprise?.nom : 'Aucune entreprise associée'}</p>
                </div>

                {colis.entreprise?.nom !== 'N/A' && colis.entreprise?.nom && (
                  <>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Email</h4>
                      <p>{colis.entreprise?.email || `contact@${colis.entreprise?.nom.toLowerCase().replace(/\s+/g, '')}.com`}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Téléphone</h4>
                      <p>{colis.entreprise?.telephone || '+212 5XX-XXXXXX'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Adresse</h4>
                      <p>{colis.entreprise?.adresse || 'Casablanca, Maroc'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Vendor Contacts */}
          <div>
            <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
              <MessageCircle className="mr-2 h-4 w-4" />
              Contacts Vendeurs
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Vendeur B */}
              {colis.entreprise?.telephone && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Vendeur B</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{colis.entreprise.telephone}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.open(`tel:${colis.entreprise?.telephone}`, '_self')}
                    >
                      <Phone className="mr-1 h-3 w-3" />
                      Vendeur B
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => window.open(`https://wa.me/${colis.entreprise?.telephone?.replace(/\D/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="mr-1 h-3 w-3" />
                      Vendeur B
                    </Button>
                  </div>
                </div>
              )}

              {/* Vendeur P */}
              {colis.entreprise?.telephone_2 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Vendeur P</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{colis.entreprise.telephone_2}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => window.open(`tel:${colis.entreprise?.telephone_2}`, '_self')}
                    >
                      <Phone className="mr-1 h-3 w-3" />
                      Vendeur P
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                      onClick={() => window.open(`https://wa.me/${colis.entreprise?.telephone_2?.replace(/\D/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="mr-1 h-3 w-3" />
                      Vendeur P
                    </Button>
                  </div>
                </div>
              )}

              {/* No phone numbers available */}
              {!colis.entreprise?.telephone && !colis.entreprise?.telephone_2 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucun numéro de téléphone disponible pour cette entreprise
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}