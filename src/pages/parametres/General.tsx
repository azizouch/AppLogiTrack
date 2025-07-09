import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export function General() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // Company information state
  const [companyInfo, setCompanyInfo] = useState({
    nom: 'LogiTrack',
    adresse: '123 Rue de la Logistique',
    ville: '75001 Paris',
    telephone: '01 23 45 67 89',
    email: 'contact@logitrack.fr',
  });

  // System preferences state
  const [systemPrefs, setSystemPrefs] = useState({
    notifications_email: true,
    signature_electronique: true,
    historique_statuts: true,
    langue: 'francais',
  });

  // Numbering format state
  const [numberingFormat, setNumberingFormat] = useState({
    colis: {
      prefix: 'COL',
      separator: '-',
      includeYear: true,
      digitCount: 4,
    },
    bonDistribution: {
      prefix: 'BD',
      separator: '-',
      includeYear: true,
      digitCount: 4,
    },
  });

  const handleSaveCompanyInfo = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Succès',
        description: 'Les informations de l\'entreprise ont été enregistrées',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer les informations',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemPrefs = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Succès',
        description: 'Les préférences système ont été enregistrées',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer les préférences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNumberingFormat = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Succès',
        description: 'Le format de numérotation a été enregistré',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le format de numérotation',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Generate preview for numbering format
  const generatePreview = (format: any) => {
    const currentYear = new Date().getFullYear();
    const yearPart = format.includeYear ? currentYear.toString() : '';
    const numberPart = '0001'.padStart(format.digitCount, '0');

    if (format.includeYear) {
      return `${format.prefix}${format.separator}${yearPart}${format.separator}${numberPart}`;
    } else {
      return `${format.prefix}${format.separator}${numberPart}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-400">Configurez les paramètres de votre système de gestion logistique</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-2 py-1.5 md:px-4 md:py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'general'
              ? 'bg-gray-900 dark:bg-gray-700 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Général
        </button>
        <button
          onClick={() => setActiveTab('numerotation')}
          className={`px-2 py-1.5 md:px-4 md:py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'numerotation'
              ? 'bg-gray-900 dark:bg-gray-700 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Numérotation
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Company Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Informations de l'entreprise</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Ces informations apparaîtront sur les bons de distribution et autres documents</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nom" className="text-sm font-medium text-gray-900 dark:text-white">
                  Nom de l'entreprise
                </Label>
                <Input
                  id="nom"
                  value={companyInfo.nom}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, nom: e.target.value })}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="adresse" className="text-sm font-medium text-gray-900 dark:text-white">
                  Adresse
                </Label>
                <Input
                  id="adresse"
                  value={companyInfo.adresse}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, adresse: e.target.value })}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="ville" className="text-sm font-medium text-gray-900 dark:text-white">
                  Ville
                </Label>
                <Input
                  id="ville"
                  value={companyInfo.ville}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, ville: e.target.value })}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="telephone" className="text-sm font-medium text-gray-900 dark:text-white">
                  Téléphone
                </Label>
                <Input
                  id="telephone"
                  value={companyInfo.telephone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, telephone: e.target.value })}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <Button
                onClick={handleSaveCompanyInfo}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>

          {/* System Preferences */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Préférences système</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Configurez les préférences générales du système</p>
            </div>

            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications par email</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Envoyer des notifications par email lors des changements de statut</p>
                </div>
                <Switch
                  checked={systemPrefs.notifications_email}
                  onCheckedChange={(checked) =>
                    setSystemPrefs({ ...systemPrefs, notifications_email: checked })
                  }
                />
              </div>

              {/* Electronic Signature */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Signature électronique</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Activer la signature électronique pour les bons de distribution</p>
                </div>
                <Switch
                  checked={systemPrefs.signature_electronique}
                  onCheckedChange={(checked) =>
                    setSystemPrefs({ ...systemPrefs, signature_electronique: checked })
                  }
                />
              </div>

              {/* Status History */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Historique des statuts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conserver l'historique des changements de statut</p>
                </div>
                <Switch
                  checked={systemPrefs.historique_statuts}
                  onCheckedChange={(checked) =>
                    setSystemPrefs({ ...systemPrefs, historique_statuts: checked })
                  }
                />
              </div>

              {/* Language */}
              <div>
                <Label htmlFor="langue" className="text-sm font-medium text-gray-900 dark:text-white">
                  Langue
                </Label>
                <Select
                  value={systemPrefs.langue}
                  onValueChange={(value) => setSystemPrefs({ ...systemPrefs, langue: value })}
                >
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="francais">Français</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="espanol">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSaveSystemPrefs}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'numerotation' && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Format de numérotation</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Configurez le format des numéros pour les colis et les bons de distribution</p>
          </div>

          {/* Format des numéros de colis */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Format des numéros de colis</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Prefix */}
              <div>
                <Label htmlFor="colis-prefix" className="text-sm font-medium text-gray-900 dark:text-white">
                  Préfixe
                </Label>
                <Input
                  id="colis-prefix"
                  value={numberingFormat.colis.prefix}
                  onChange={(e) => setNumberingFormat({
                    ...numberingFormat,
                    colis: { ...numberingFormat.colis, prefix: e.target.value }
                  })}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="COL"
                />
              </div>

              {/* Separator */}
              <div>
                <Label htmlFor="colis-separator" className="text-sm font-medium text-gray-900 dark:text-white">
                  Séparateur
                </Label>
                <Input
                  id="colis-separator"
                  value={numberingFormat.colis.separator}
                  onChange={(e) => setNumberingFormat({
                    ...numberingFormat,
                    colis: { ...numberingFormat.colis, separator: e.target.value }
                  })}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="-"
                />
              </div>

              {/* Include Year */}
              <div>
                <Label htmlFor="colis-year" className="text-sm font-medium text-gray-900 dark:text-white">
                  Inclure l'année
                </Label>
                <Select
                  value={numberingFormat.colis.includeYear ? 'oui' : 'non'}
                  onValueChange={(value) => setNumberingFormat({
                    ...numberingFormat,
                    colis: { ...numberingFormat.colis, includeYear: value === 'oui' }
                  })}
                >
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui</SelectItem>
                    <SelectItem value="non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Number of digits */}
              <div>
                <Label htmlFor="colis-digits" className="text-sm font-medium text-gray-900 dark:text-white">
                  Nombre de chiffres
                </Label>
                <Select
                  value={numberingFormat.colis.digitCount.toString()}
                  onValueChange={(value) => setNumberingFormat({
                    ...numberingFormat,
                    colis: { ...numberingFormat.colis, digitCount: parseInt(value) }
                  })}
                >
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 chiffres</SelectItem>
                    <SelectItem value="4">4 chiffres</SelectItem>
                    <SelectItem value="5">5 chiffres</SelectItem>
                    <SelectItem value="6">6 chiffres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aperçu:</p>
              <p className="font-mono text-lg text-gray-900 dark:text-white">
                {generatePreview(numberingFormat.colis)}
              </p>
            </div>
          </div>

          {/* Format des numéros de bons de distribution */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Format des numéros de bons de distribution</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Prefix */}
              <div>
                <Label htmlFor="bd-prefix" className="text-sm font-medium text-gray-900 dark:text-white">
                  Préfixe
                </Label>
                <Input
                  id="bd-prefix"
                  value={numberingFormat.bonDistribution.prefix}
                  onChange={(e) => setNumberingFormat({
                    ...numberingFormat,
                    bonDistribution: { ...numberingFormat.bonDistribution, prefix: e.target.value }
                  })}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="BD"
                />
              </div>

              {/* Separator */}
              <div>
                <Label htmlFor="bd-separator" className="text-sm font-medium text-gray-900 dark:text-white">
                  Séparateur
                </Label>
                <Input
                  id="bd-separator"
                  value={numberingFormat.bonDistribution.separator}
                  onChange={(e) => setNumberingFormat({
                    ...numberingFormat,
                    bonDistribution: { ...numberingFormat.bonDistribution, separator: e.target.value }
                  })}
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="-"
                />
              </div>

              {/* Include Year */}
              <div>
                <Label htmlFor="bd-year" className="text-sm font-medium text-gray-900 dark:text-white">
                  Inclure l'année
                </Label>
                <Select
                  value={numberingFormat.bonDistribution.includeYear ? 'oui' : 'non'}
                  onValueChange={(value) => setNumberingFormat({
                    ...numberingFormat,
                    bonDistribution: { ...numberingFormat.bonDistribution, includeYear: value === 'oui' }
                  })}
                >
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui</SelectItem>
                    <SelectItem value="non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Number of digits */}
              <div>
                <Label htmlFor="bd-digits" className="text-sm font-medium text-gray-900 dark:text-white">
                  Nombre de chiffres
                </Label>
                <Select
                  value={numberingFormat.bonDistribution.digitCount.toString()}
                  onValueChange={(value) => setNumberingFormat({
                    ...numberingFormat,
                    bonDistribution: { ...numberingFormat.bonDistribution, digitCount: parseInt(value) }
                  })}
                >
                  <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 chiffres</SelectItem>
                    <SelectItem value="4">4 chiffres</SelectItem>
                    <SelectItem value="5">5 chiffres</SelectItem>
                    <SelectItem value="6">6 chiffres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aperçu:</p>
              <p className="font-mono text-lg text-gray-900 dark:text-white">
                {generatePreview(numberingFormat.bonDistribution)}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveNumberingFormat}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
