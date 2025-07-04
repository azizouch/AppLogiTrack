import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { Filter, Search, Eye, UserCheck, UserX, MessageCircle, X, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/supabase';

interface UserActivity {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'Admin' | 'Gestionnaire' | 'Livreur';
  statut: 'Actif' | 'Inactif';
  derniere_connexion: string | null;
  derniere_activite: string;
  en_ligne: boolean;
}

export function Suivi() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserActivity[]>([]);
  const [paginatedUsers, setPaginatedUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Fetch users from database
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await api.getUsers();

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les utilisateurs',
          variant: 'destructive',
        });
        setUsers([]);
      } else if (data) {
        // Transform data to include activity information
        const usersWithActivity = data.map(user => ({
          ...user,
          derniere_activite: formatLastActivity(user.derniere_connexion),
          en_ligne: isUserOnline(user.derniere_connexion),
        }));
        setUsers(usersWithActivity);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Action handlers
  const handleViewProfile = (user: UserActivity) => {
    // Navigate to user profile or show profile modal
    toast({
      title: 'Profil utilisateur',
      description: `Affichage du profil de ${user.nom} ${user.prenom}`,
    });
    // TODO: Implement navigation to user profile page
  };

  const handleManagePermissions = (user: UserActivity) => {
    // Open permissions management modal
    toast({
      title: 'Gestion des permissions',
      description: `Gestion des permissions pour ${user.nom} ${user.prenom}`,
    });
    // TODO: Implement permissions management modal
  };

  const handleSendMessage = (user: UserActivity) => {
    // Open message composition modal
    toast({
      title: 'Envoyer un message',
      description: `Envoi d'un message à ${user.nom} ${user.prenom}`,
    });
    // TODO: Implement message sending functionality
  };

  const handleSuspendUser = async (user: UserActivity) => {
    try {
      // Toggle user status between Actif and Inactif
      const newStatus = user.statut === 'Actif' ? 'Inactif' : 'Actif';

      const { error } = await api.updateUserById(user.id, { statut: newStatus });

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier le statut de l\'utilisateur',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: `Utilisateur ${newStatus === 'Actif' ? 'activé' : 'suspendu'} avec succès`,
        });
        // Refresh the users list
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modification du statut',
        variant: 'destructive',
      });
    }
  };

  // Helper function to format last activity from derniere_connexion
  const formatLastActivity = (derniereConnexion: string | null) => {
    if (!derniereConnexion) {
      return 'Jamais connecté';
    }

    const lastConnection = new Date(derniereConnexion);
    const now = new Date();
    const diffInMs = now.getTime() - lastConnection.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    } else {
      return lastConnection.toLocaleDateString('fr-FR');
    }
  };

  // Helper function to determine if user is online (connected within last 5 minutes)
  const isUserOnline = (derniereConnexion: string | null) => {
    if (!derniereConnexion) {
      return false;
    }

    const lastConnection = new Date(derniereConnexion);
    const now = new Date();
    const diffInMs = now.getTime() - lastConnection.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    return diffInMinutes <= 5; // Consider online if connected within last 5 minutes
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'en_ligne') {
        filtered = filtered.filter(user => user.en_ligne);
      } else if (statusFilter === 'hors_ligne') {
        filtered = filtered.filter(user => !user.en_ligne);
      } else if (statusFilter === 'actif') {
        filtered = filtered.filter(user => user.statut === 'Actif');
      } else if (statusFilter === 'inactif') {
        filtered = filtered.filter(user => user.statut === 'Inactif');
      }
    }

    setFilteredUsers(filtered);

    // Reset to first page when filters change
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Apply pagination to filtered users
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredUsers.slice(startIndex, endIndex);

    setPaginatedUsers(paginated);
    setTotalPages(Math.ceil(filteredUsers.length / itemsPerPage));
    setHasNextPage(endIndex < filteredUsers.length);
    setHasPrevPage(currentPage > 1);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Gestionnaire':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Livreur':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusBadgeColor = (statut: string, enLigne: boolean) => {
    if (enLigne) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Activity className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          Suivi des utilisateurs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Suivez et gérez l'activité des utilisateurs de la plateforme</p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Filtres</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Gestionnaire">Gestionnaire</SelectItem>
              <SelectItem value="Livreur">Livreur</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en_ligne">En ligne</SelectItem>
              <SelectItem value="hors_ligne">Hors ligne</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <div className="space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des utilisateurs</h2>
            <div className="flex justify-between items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-16 h-8 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <SelectValue placeholder={itemsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="5" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">5</SelectItem>
                  <SelectItem value="10" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">10</SelectItem>
                  <SelectItem value="25" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">25</SelectItem>
                  <SelectItem value="50" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500 dark:text-gray-400">entrées</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total: {filteredUsers.length} utilisateurs
            </span>
            </div>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
                    <TableHead className="text-gray-900 font-medium">Nom</TableHead>
                    <TableHead className="text-gray-900 font-medium">Email</TableHead>
                    <TableHead className="text-gray-900 font-medium">Rôle</TableHead>
                    <TableHead className="text-gray-900 font-medium">Dernière activité</TableHead>
                    <TableHead className="text-gray-900 font-medium">Statut</TableHead>
                    <TableHead className="text-gray-900 font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-transparent">
                      <TableCell className="text-gray-900 dark:text-white font-medium">
                        {user.nom} {user.prenom}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {user.derniere_activite}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(user.statut, user.en_ligne)}>
                          {user.en_ligne ? 'En ligne' : 'Hors ligne'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900"
                            title="Voir le profil"
                            onClick={() => handleViewProfile(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900"
                            title="Gérer les permissions"
                            onClick={() => handleManagePermissions(user)}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900"
                            title="Envoyer un message"
                            onClick={() => handleSendMessage(user)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${
                              user.statut === 'Actif'
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900'
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900'
                            }`}
                            title={user.statut === 'Actif' ? 'Suspendre l\'utilisateur' : 'Activer l\'utilisateur'}
                            onClick={() => handleSuspendUser(user)}
                          >
                            {user.statut === 'Actif' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
