import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TablePagination } from '@/components/ui/table-pagination';
import { Filter, Search, UserPlus, ShieldCheck, Edit, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/supabase';

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: 'Admin' | 'Gestionnaire' | 'Livreur';
  statut: 'Actif' | 'Inactif';
  derniere_connexion: string;
  adresse: string;
  ville: string;
}

export function Gestion() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [newUser, setNewUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'Gestionnaire',
    statut: 'Actif',
    adresse: '',
    ville: '',
    password: '',
    confirmPassword: '',
  });

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
        setUsers(data);
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
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.statut === statusFilter);
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

  const handleAddUser = async () => {
    if (!newUser.nom || !newUser.prenom || !newUser.email || !newUser.password) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      });
      return;
    }

    try {
      const userData = {
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        telephone: newUser.telephone,
        role: newUser.role,
        statut: newUser.statut,
        adresse: newUser.adresse,
        ville: newUser.ville,
        mot_de_passe: '', // We don't store passwords in our table
        derniere_connexion: null,
        date_creation: new Date().toISOString(),
        date_mise_a_jour: new Date().toISOString(),
      };

      const { data, error } = await api.createUser(userData);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the users list
      await fetchUsers();

      setShowAddModal(false);
      setNewUser({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: 'Gestionnaire',
        statut: 'Actif',
        adresse: '',
        ville: '',
        password: '',
        confirmPassword: '',
      });

      toast({
        title: 'Succès',
        description: 'Utilisateur ajouté avec succès',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'utilisateur',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      statut: user.statut,
      adresse: user.adresse,
      ville: user.ville,
      password: '',
      confirmPassword: '',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !newUser.nom || !newUser.prenom || !newUser.email) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      const userData = {
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        telephone: newUser.telephone,
        role: newUser.role,
        statut: newUser.statut,
        adresse: newUser.adresse,
        ville: newUser.ville,
        date_mise_a_jour: new Date().toISOString(),
      };

      const { data, error } = await api.updateUser(editingUser.id, userData);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the users list
      await fetchUsers();

      setShowEditModal(false);
      setEditingUser(null);
      setNewUser({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: 'Gestionnaire',
        statut: 'Actif',
        adresse: '',
        ville: '',
        password: '',
        confirmPassword: '',
      });

      toast({
        title: 'Succès',
        description: 'Utilisateur modifié avec succès',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier l\'utilisateur',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await api.deleteUser(userToDelete.id);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the users list
      await fetchUsers();

      setShowDeleteModal(false);
      setUserToDelete(null);

      toast({
        title: 'Succès',
        description: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'utilisateur',
        variant: 'destructive',
      });
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6 bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les utilisateurs de la plateforme</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={showRolesModal} onOpenChange={setShowRolesModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 inline-flex items-center gap-2 transition-colors border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                <ShieldCheck className="h-4 w-4" />
                Rôles et permissions
              </Button>
            </DialogTrigger>
          </Dialog>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="h-9 inline-flex items-center gap-2 transition-colors bg-blue-600 hover:bg-blue-700 text-white">
                <UserPlus className="h-4 w-4" />
                Ajouter un utilisateur
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
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
              <SelectItem value="Actif">Actif</SelectItem>
              <SelectItem value="Inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des utilisateurs</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-16 h-8 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <SelectValue />
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
                    <TableHead className="text-gray-900 font-medium">Téléphone</TableHead>
                    <TableHead className="text-gray-900 font-medium">Rôle</TableHead>
                    <TableHead className="text-gray-900 font-medium">Statut</TableHead>
                    <TableHead className="text-gray-900 font-medium">Dernière connexion</TableHead>
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
                      <TableCell className="text-gray-600 dark:text-gray-400">{user.telephone}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'Admin' ? 'destructive' : user.role === 'Livreur' ? 'secondary' : 'default'}
                          className={
                            user.role === 'Admin'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : user.role === 'Livreur'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.statut === 'Actif' ? 'default' : 'secondary'}
                          className={
                            user.statut === 'Actif'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }
                        >
                          {user.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">{user.derniere_connexion}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={setCurrentPage}
          loading={loading}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Add User Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Ajouter un nouvel utilisateur
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(false)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Remplissez les informations pour créer un nouvel utilisateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom" className="text-sm font-medium text-gray-900 dark:text-white">
                Nom
              </Label>
              <Input
                id="nom"
                value={newUser.nom}
                onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="prenom" className="text-sm font-medium text-gray-900 dark:text-white">
                Prénom
              </Label>
              <Input
                id="prenom"
                value={newUser.prenom}
                onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="telephone" className="text-sm font-medium text-gray-900 dark:text-white">
              Téléphone
            </Label>
            <Input
              id="telephone"
              value={newUser.telephone}
              onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })}
              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role" className="text-sm font-medium text-gray-900 dark:text-white">
                Rôle
              </Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gestionnaire">Gestionnaire</SelectItem>
                  <SelectItem value="Livreur">Livreur</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="statut" className="text-sm font-medium text-gray-900 dark:text-white">
                Statut
              </Label>
              <Select value={newUser.statut} onValueChange={(value) => setNewUser({ ...newUser, statut: value })}>
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="adresse" className="text-sm font-medium text-gray-900 dark:text-white">
              Adresse
            </Label>
            <Input
              id="adresse"
              placeholder="Adresse complète"
              value={newUser.adresse}
              onChange={(e) => setNewUser({ ...newUser, adresse: e.target.value })}
              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="ville" className="text-sm font-medium text-gray-900 dark:text-white">
              Ville
            </Label>
            <Input
              id="ville"
              value={newUser.ville}
              onChange={(e) => setNewUser({ ...newUser, ville: e.target.value })}
              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-white">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900 dark:text-white">
              Confirmer
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={newUser.confirmPassword}
              onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowAddModal(false)}
            className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddUser}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Ajouter
          </Button>
        </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Modifier l'utilisateur
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Modifiez les informations de l'utilisateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-nom" className="text-sm font-medium text-gray-900 dark:text-white">
                Nom
              </Label>
              <Input
                id="edit-nom"
                value={newUser.nom}
                onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-prenom" className="text-sm font-medium text-gray-900 dark:text-white">
                Prénom
              </Label>
              <Input
                id="edit-prenom"
                value={newUser.prenom}
                onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-email" className="text-sm font-medium text-gray-900 dark:text-white">
              Email
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="edit-telephone" className="text-sm font-medium text-gray-900 dark:text-white">
              Téléphone
            </Label>
            <Input
              id="edit-telephone"
              value={newUser.telephone}
              onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })}
              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-role" className="text-sm font-medium text-gray-900 dark:text-white">
                Rôle
              </Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectItem value="Admin" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Admin</SelectItem>
                  <SelectItem value="Gestionnaire" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Gestionnaire</SelectItem>
                  <SelectItem value="Livreur" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Livreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-statut" className="text-sm font-medium text-gray-900 dark:text-white">
                Statut
              </Label>
              <Select value={newUser.statut} onValueChange={(value) => setNewUser({ ...newUser, statut: value })}>
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectItem value="Actif" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Actif</SelectItem>
                  <SelectItem value="Inactif" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-adresse" className="text-sm font-medium text-gray-900 dark:text-white">
                Adresse
              </Label>
              <Input
                id="edit-adresse"
                value={newUser.adresse}
                onChange={(e) => setNewUser({ ...newUser, adresse: e.target.value })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-ville" className="text-sm font-medium text-gray-900 dark:text-white">
                Ville
              </Label>
              <Input
                id="edit-ville"
                value={newUser.ville}
                onChange={(e) => setNewUser({ ...newUser, ville: e.target.value })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(false)}
            className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpdateUser}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Modifier
          </Button>
        </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Cette action est irréversible. L'utilisateur sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700 dark:text-gray-300">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <span className="font-semibold">
                {userToDelete?.nom} {userToDelete?.prenom}
              </span>{' '}
              ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Email: {userToDelete?.email}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setUserToDelete(null);
              }}
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Roles and Permissions Modal */}
      <Dialog open={showRolesModal} onOpenChange={setShowRolesModal}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Rôles et permissions
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Aperçu des différents rôles et leurs permissions dans le système
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
          {/* Admin Role */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Accès complet à toutes les fonctionnalités du système</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Gestion des utilisateurs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Configuration système</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Gestion des colis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Assignation des livreurs</span>
              </div>
            </div>
          </div>

          {/* Gestionnaire Role */}
          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gestionnaire</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gestion des colis, clients et entreprises</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Créer/éditer colis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Gestion des clients</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Générer bons de distribution</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Configuration système</span>
              </div>
            </div>
          </div>

          {/* Livreur Role */}
          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Livreur</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Accès limité aux bons de distribution et colis assignés</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Voir les bons assignés</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Modifier statut des colis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Gestion des clients</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Créer nouveaux colis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => setShowRolesModal(false)}
            className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}