import React, { useState } from 'react';
import { Sun, Globe, Building, Settings } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

  // Theme and appearance settings
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [language, setLanguage] = useState('fr');

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

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations de l'entreprise
              </CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur les bons de distribution et autres documents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div>
                <Label htmlFor="nom">
                  Nom de l'entreprise
                </Label>
                <Input
                  id="nom"
                  value={companyInfo.nom}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, nom: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="adresse">
                  Adresse
                </Label>
                <Input
                  id="adresse"
                  value={companyInfo.adresse}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, adresse: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="ville">
                  Ville
                </Label>
                <Input
                  id="ville"
                  value={companyInfo.ville}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, ville: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="telephone">
                  Téléphone
                </Label>
                <Input
                  id="telephone"
                  value={companyInfo.telephone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, telephone: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleSaveCompanyInfo}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Préférences système
              </CardTitle>
              <CardDescription>
                Configurez les préférences générales du système
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Envoyer des notifications par email lors des changements de statut</p>
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
                <div className="space-y-0.5">
                  <Label>Signature électronique</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Activer la signature électronique pour les bons de distribution</p>
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
                <div className="space-y-0.5">
                  <Label>Historique des statuts</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Conserver l'historique des changements de statut</p>
                </div>
                <Switch
                  checked={systemPrefs.historique_statuts}
                  onCheckedChange={(checked) =>
                    setSystemPrefs({ ...systemPrefs, historique_statuts: checked })
                  }
                />
              </div>

              <Button
                onClick={handleSaveSystemPrefs}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode sombre</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Activer le thème sombre
                  </p>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Langue</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <Globe className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
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
