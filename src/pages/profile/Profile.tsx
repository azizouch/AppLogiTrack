import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function Profile() {
  const { state } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: ''
  });

  useEffect(() => {
    if (state.user) {
      setProfileData({
        nom: state.user.nom || '',
        prenom: state.user.prenom || '',
        email: state.user.email || '',
        telephone: state.user.telephone || '',
        adresse: state.user.adresse || '',
        ville: state.user.ville || ''
      });
    }
  }, [state.user]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!state.user?.id) return;

    setLoading(true);
    try {
      const { error } = await api.updateUser(state.user.id, profileData);
      
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le profil",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Profil mis à jour avec succès",
        });
        setIsEditing(false);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (state.user) {
      setProfileData({
        nom: state.user.nom || '',
        prenom: state.user.prenom || '',
        email: state.user.email || '',
        telephone: state.user.telephone || '',
        adresse: state.user.adresse || '',
        ville: state.user.ville || ''
      });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrateur', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      livreur: { label: 'Livreur', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      user: { label: 'Utilisateur', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (!state.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {state.user.prenom?.[0] || state.user.nom[0]}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                disabled={!isEditing}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="mt-4">
              {`${profileData.prenom || ''} ${profileData.nom}`.trim()}
            </CardTitle>
            <div className="flex items-center justify-center gap-2 mt-2">
              {getRoleBadge(state.user.role)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">{profileData.email}</span>
            </div>
            {profileData.telephone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">{profileData.telephone}</span>
              </div>
            )}
            {profileData.adresse && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">{profileData.adresse}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Membre depuis {formatDate(state.user.date_creation)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles et de contact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                {isEditing ? (
                  <Input
                    id="prenom"
                    value={profileData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    placeholder="Votre prénom"
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
                    {profileData.prenom || 'Non renseigné'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                {isEditing ? (
                  <Input
                    id="nom"
                    value={profileData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    placeholder="Votre nom"
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
                    {profileData.nom || 'Non renseigné'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="votre@email.com"
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
                    {profileData.email || 'Non renseigné'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                {isEditing ? (
                  <Input
                    id="telephone"
                    value={profileData.telephone}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                    placeholder="+212 6XX-XXXXXX"
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
                    {profileData.telephone || 'Non renseigné'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              {isEditing ? (
                <Input
                  id="adresse"
                  value={profileData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                  placeholder="Votre adresse complète"
                />
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
                  {profileData.adresse || 'Non renseigné'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ville">Ville</Label>
              {isEditing ? (
                <Input
                  id="ville"
                  value={profileData.ville}
                  onChange={(e) => handleInputChange('ville', e.target.value)}
                  placeholder="Votre ville"
                />
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
                  {profileData.ville || 'Non renseigné'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
