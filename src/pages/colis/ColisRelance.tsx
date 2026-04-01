import React from 'react';
import { MesColis } from './MesColis';

export function ColisRelance() {
  return (
    <MesColis
      initialStatus="Relancé"
      pageTitle="Colis Relancé"
      pageDescription="Liste des colis à relancer. Filtrez et triez les colis en statut Relancé, en tant que livreur."
    />
  );
}
