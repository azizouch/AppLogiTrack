import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function AddClient() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Generate client ID
  const generateClientId = () => {
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CLI-${randomNum}`;
  };

  const [formData, setFormData] = useState({
    id: generateClientId(),
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    entreprise: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du client est requis',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await api.createClient(formData);

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de créer le client',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: 'Client créé avec succès',
        });
        navigate('/clients');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/clients')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Retour à la liste</h1>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nouveau Client</h1>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informations du client</h2>
          <p className="text-gray-600 dark:text-gray-400">Remplissez les informations pour créer un nouveau client</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="id">ID Client</Label>
              <Input
                id="id"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                readOnly
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">ID généré automatiquement (vous pouvez le modifier)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
              <Input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                placeholder="Nom du client"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                placeholder="Numéro de téléphone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Adresse email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entreprise">Entreprise (fonctionnalité future)</Label>
            <select
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled
            >
              <option value="">Aucune</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">Note: Cette fonctionnalité sera disponible dans une future mise à jour.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Textarea
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleInputChange}
              placeholder="Adresse complète"
              rows={3}
            />
          </div>
          <div className="flex justify-start gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/clients')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
