import React from 'react';
import { MesColis } from './MesColis';

export function RelanceAutreClient() {
  return (
    <MesColis
      initialStatus="Relancé nouveau client"
      pageTitle="Relancé Autre Client"
      pageDescription="Liste des colis à relancer vers un autre client. Filtrez et triez selon vos besoins."
    />
  );
}
