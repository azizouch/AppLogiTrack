# Template Excel pour l'importation des Colis

## Instructions

1. Créez un fichier Excel (.xlsx) avec les colonnes suivantes:

### Colonnes Requises:
- **client_id** - L'ID du client (doit exister dans votre base de données)
- **adresse_livraison** - Adresse complète de livraison

### Colonnes Optionnelles:
- **entreprise_id** - L'ID de l'entreprise associée
- **statut** - Statut du colis (par défaut: "nouveau")
- **prix** - Prix du colis (nombre)
- **frais** - Frais de livraison (nombre)
- **notes** - Notes additionnelles

## Exemple de données:

| client_id | adresse_livraison | entreprise_id | statut | prix | frais | notes |
|-----------|-------------------|---------------|--------|------|-------|-------|
| client-001 | 123 Rue de la Paix, Alger | ent-001 | nouveau | 500 | 50 | Livraison urgente |
| client-002 | 456 Avenue des Fleurs, Oran | ent-002 | nouveau | 750 | 75 | Fragile |
| client-003 | 789 Boulevard Central, Constantine | ent-001 | nouveau | 1000 | 100 | En haut étage |

## Comment utiliser:

1. **Téléchargez un template Excel** (créez un nouveau fichier dans Excel/LibreOffice)
2. **Remplissez les colonnes requises** avec vos données
3. **Allez à la page "Colis"** dans votre application
4. **Cliquez sur "Importer Excel"** bouton
5. **Sélectionnez votre fichier Excel**
6. **Vérifiez l'aperçu** des données
7. **Cliquez sur "Importer"** pour ajouter tous les colis à la base de données

## Points importants:

- ⚠️ Les IDs de client **DOIVENT exister** dans votre base de données
- ⚠️ Les IDs d'entreprise **DOIVENT exister** dans votre base de données (optionnel)
- ✅ Les prix et frais doivent être des nombres (ex: 500, 75.50)
- ✅ Vous pouvez laisser les colonnes optionnelles vides
- ✅ L'adresse de livraison est obligatoire
- ✅ Un aperçu des données s'affiche **avant** l'import pour vérifier les données

## Résolution des erreurs:

Si vous voyez des erreurs lors du test d'import:

1. **"client manquant"** - Vérifiez que le client_id existe dans votre base de données
2. **"adresse de livraison manquante"** - Cette colonne est obligatoire
3. **"prix invalide"** - Assurez-vous que c'est un nombre (ex: 500, pas "500 DZD")

## Après l'import:

- Vérifiez que tous les colis ont été importés avec succès
- Les colis importés auront le statut "nouveau" par défaut
- Vous pouvez les modifier individuellement si nécessaire
