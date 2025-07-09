import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Entreprise } from '@/types';

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: any) => void;
}

export function AddClientModal({ open, onOpenChange, onClientCreated }: AddClientModalProps) {
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
      const { data, error } = await api.createClient(formData);

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
        
        // Reset form
        setFormData({
          id: generateClientId(),
          nom: '',
          email: '',
          telephone: '',
          adresse: '',
          entreprise: ''
        });
        
        // Call the callback with the created client
        onClientCreated(data);
        
        // Close modal
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Nouveau Client
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Remplissez les informations pour créer un nouveau client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom complet *</Label>
            <Input
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              placeholder="Nom complet du client"
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

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Créer
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
