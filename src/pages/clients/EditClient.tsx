import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/supabase';
import { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function EditClient() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    id: '',
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

  // Fetch client data
  useEffect(() => {
    const fetchClient = async () => {
      if (!id) {
        navigate('/clients');
        return;
      }

      try {
        const { data, error } = await api.getClientById(id);

        if (error) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les données du client',
            variant: 'destructive',
          });
          navigate('/clients');
          return;
        }

        if (data) {
          setClient(data);
          // Update form with client data
          setFormData({
            id: data.id || '',
            nom: data.nom || '',
            telephone: data.telephone || '',
            email: data.email || '',
            adresse: data.adresse || '',
            entreprise: data.entreprise || '',
          });
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors du chargement',
          variant: 'destructive',
        });
        navigate('/clients');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

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
      const { error } = await api.updateClient(id, formData);

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier le client',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: 'Client modifié avec succès',
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

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/clients')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Retour aux détails</h1>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Modifier le Client</h1>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/clients')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Client introuvable</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/clients/${id}`)}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Retour aux détails</h1>
      </div>

      <h1 className="text-3xl font-bold text-gray-900">Modifier le Client</h1>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Informations du client</h2>
          <p className="text-gray-600">Modifiez les informations du client</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="id">ID Client</Label>
              <Input
                id="id"
                name="id"
                value={formData.id}
                className="bg-gray-50"
                readOnly
              />
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled
            >
              <option value="">Aucune</option>
            </select>
            <p className="text-sm text-gray-500">Note: Cette fonctionnalité sera disponible dans une future mise à jour.</p>
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
              onClick={() => navigate(`/clients/${id}`)}
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
