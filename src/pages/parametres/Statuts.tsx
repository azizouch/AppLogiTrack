import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Edit, Trash2, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TablePagination } from '@/components/ui/table-pagination';
import { api } from '@/lib/supabase';
import { Statut } from '@/types';
import { useToast } from '@/hooks/use-toast';

const COLORS = [
  { name: 'Bleu', value: 'blue', class: 'bg-blue-500 text-white' },
  { name: 'Vert', value: 'green', class: 'bg-green-500 text-white' },
  { name: 'Rouge', value: 'red', class: 'bg-red-500 text-white' },
  { name: 'Jaune', value: 'yellow', class: 'bg-yellow-500 text-black' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500 text-white' },
  { name: 'Violet', value: 'purple', class: 'bg-purple-500 text-white' },
  { name: 'Rose', value: 'pink', class: 'bg-pink-500 text-white' },
  { name: 'Gris', value: 'gray', class: 'bg-gray-500 text-white' },
  { name: 'Turquoise', value: 'teal', class: 'bg-teal-500 text-white' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500 text-white' },
  { name: 'Vert Lime', value: 'lime', class: 'bg-lime-500 text-black' },
  { name: 'Cyan', value: 'cyan', class: 'bg-cyan-500 text-white' },
  { name: 'Ambre', value: 'amber', class: 'bg-amber-500 text-black' },
];

const STATUS_TYPES = [
  { value: 'colis', label: 'Colis' },
  { value: 'bon', label: 'Bon' },
  { value: 'livreur', label: 'Livreur' },
  { value: 'client', label: 'Client' },
];

interface StatusFormData {
  nom: string;
  couleur: string;
  ordre: number;
  type: string;
  actif: boolean;
}

export function Statuts() {
  const { toast } = useToast();
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [filteredStatuts, setFilteredStatuts] = useState<Statut[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedStatuts, setPaginatedStatuts] = useState<Statut[]>([]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStatut, setEditingStatut] = useState<Statut | null>(null);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState<StatusFormData>({
    nom: '',
    couleur: 'blue',
    ordre: 1,
    type: 'colis',
    actif: true,
  });

  // Fetch statuts
  const fetchStatuts = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.getAllStatuts();

      if (error) {
        console.error('Error fetching statuts:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les statuts',
          variant: 'destructive',
        });
      } else if (data) {
        setStatuts(data);
        setFilteredStatuts(data);
      }
    } catch (error) {
      console.error('Error fetching statuts:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuts();
  }, []);

  // Filter statuts based on search and filters
  useEffect(() => {
    let filtered = statuts;

    if (searchTerm) {
      filtered = filtered.filter(statut =>
        statut.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(statut => statut.type === typeFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'actif') {
        filtered = filtered.filter(statut => statut.actif);
      } else if (statusFilter === 'inactif') {
        filtered = filtered.filter(statut => !statut.actif);
      }
    }

    setFilteredStatuts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [statuts, searchTerm, typeFilter, statusFilter]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedStatuts(filteredStatuts.slice(startIndex, endIndex));
  }, [filteredStatuts, currentPage, itemsPerPage]);

  // Check if filters are active
  const hasActiveFilters = searchTerm !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredStatuts.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredStatuts.length);

  // Get color class for a status
  const getColorClass = (couleur: string) => {
    const color = COLORS.find(c => c.value === couleur);
    return color ? color.class : 'bg-gray-500 text-white';
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nom: '',
      couleur: 'blue',
      ordre: 1,
      type: 'colis',
      actif: true,
    });
  };

  // Handle add statut
  const handleAddStatut = async () => {
    if (!formData.nom.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du statut est requis',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await api.createStatut({
        nom: formData.nom.trim(),
        couleur: formData.couleur,
        ordre: formData.ordre,
        type: formData.type,
        actif: formData.actif,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Succès',
        description: 'Le statut a été créé avec succès',
      });

      setIsAddModalOpen(false);
      resetForm();
      fetchStatuts();
    } catch (error) {
      console.error('Error creating statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le statut',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle edit statut
  const handleEditStatut = async () => {
    if (!editingStatut || !formData.nom.trim()) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await api.updateStatut(editingStatut.id, {
        nom: formData.nom.trim(),
        couleur: formData.couleur,
        ordre: formData.ordre,
        type: formData.type,
        actif: formData.actif,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Succès',
        description: 'Le statut a été modifié avec succès',
      });

      setIsEditModalOpen(false);
      setEditingStatut(null);
      resetForm();
      fetchStatuts();
    } catch (error) {
      console.error('Error updating statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete statut
  const handleDeleteStatut = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce statut ?')) {
      return;
    }

    try {
      const { error } = await api.deleteStatut(id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Succès',
        description: 'Le statut a été supprimé avec succès',
      });

      fetchStatuts();
    } catch (error) {
      console.error('Error deleting statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le statut',
        variant: 'destructive',
      });
    }
  };

  // Open edit modal
  const openEditModal = (statut: Statut) => {
    setEditingStatut(statut);
    setFormData({
      nom: statut.nom,
      couleur: statut.couleur || 'blue',
      ordre: statut.ordre || 1,
      type: statut.type,
      actif: statut.actif ?? true,
    });
    setIsEditModalOpen(true);
  };

  // Close modals
  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingStatut(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Statuts</h1>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un statut
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtres</span>
          </div>
          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
              className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un statut..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Tous les types</SelectItem>
              {STATUS_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Tous les statuts</SelectItem>
              <SelectItem value="actif" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Actif</SelectItem>
              <SelectItem value="inactif" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des statuts</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
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
                Total: {filteredStatuts.length} statuts
              </span>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400">
          <div>Nom</div>
          <div>Couleur</div>
          <div>Type</div>
          <div>Ordre</div>
          <div>Actif</div>
          <div>Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedStatuts.length > 0 ? (
            paginatedStatuts.map((statut) => (
              <div key={statut.id} className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {/* Name */}
                <div>
                  <Badge className={`${getColorClass(statut.couleur || 'gray')} border-0`}>
                    {statut.nom}
                  </Badge>
                </div>

                {/* Color */}
                <div className="capitalize text-gray-700 dark:text-gray-300">
                  {COLORS.find(c => c.value === statut.couleur)?.name || statut.couleur}
                </div>

                {/* Type */}
                <div className="capitalize text-gray-700 dark:text-gray-300">
                  {STATUS_TYPES.find(t => t.value === statut.type)?.label || statut.type}
                </div>

                {/* Order */}
                <div className="text-gray-700 dark:text-gray-300">
                  {statut.ordre || 1}
                </div>

                {/* Active */}
                <div>
                  <Switch
                    checked={statut.actif ?? true}
                    onCheckedChange={async (checked) => {
                      try {
                        await api.updateStatut(statut.id, { actif: checked });
                        fetchStatuts();
                        toast({
                          title: 'Succès',
                          description: `Statut ${checked ? 'activé' : 'désactivé'} avec succès`,
                        });
                      } catch (error) {
                        toast({
                          title: 'Erreur',
                          description: 'Impossible de modifier le statut',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(statut)}
                    className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStatut(statut.id)}
                    className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <p>Aucun statut trouvé</p>
            </div>
          )}
        </div>

      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={currentPage < totalPages}
          hasPrevPage={currentPage > 1}
          onPageChange={setCurrentPage}
          totalItems={filteredStatuts.length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Add Status Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={closeModals}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Ajouter un statut</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModals}
                className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Créez un nouveau statut pour les colis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="nom" className="text-sm font-medium text-gray-900 dark:text-white">
                Nom du statut
              </Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                placeholder="Entrez le nom du statut"
              />
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="couleur" className="text-sm font-medium text-gray-900 dark:text-white">
                Couleur
              </Label>
              <Select value={formData.couleur} onValueChange={(value) => setFormData({ ...formData, couleur: value })}>
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  {COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.class}`}></div>
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Color Preview */}
              <div className="mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Aperçu des couleurs:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, couleur: color.value })}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        color.class
                      } ${
                        formData.couleur === color.value ? 'ring-2 ring-blue-400' : ''
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Order */}
            <div>
              <Label htmlFor="ordre" className="text-sm font-medium text-gray-900 dark:text-white">
                Ordre d'affichage
              </Label>
              <Input
                id="ordre"
                type="number"
                min="1"
                value={formData.ordre}
                onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 1 })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-900 dark:text-white">
                Type de statut
              </Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  {STATUS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active */}
            <div className="flex items-center space-x-2">
              <Switch
                id="actif"
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                className="data-[state=checked]:bg-blue-600"
              />
              <Label htmlFor="actif" className="text-sm font-medium text-gray-900 dark:text-white">
                Actif
              </Label>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={closeModals}
              disabled={saving}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddStatut}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={closeModals}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Modifier un statut</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModals}
                className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Modifiez les informations du statut
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="edit-nom" className="text-sm font-medium text-gray-900 dark:text-white">
                Nom du statut
              </Label>
              <Input
                id="edit-nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                placeholder="Entrez le nom du statut"
              />
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="edit-couleur" className="text-sm font-medium text-gray-900 dark:text-white">
                Couleur
              </Label>
              <Select value={formData.couleur} onValueChange={(value) => setFormData({ ...formData, couleur: value })}>
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  {COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.class}`}></div>
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Color Preview */}
              <div className="mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Aperçu des couleurs:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, couleur: color.value })}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        color.class
                      } ${
                        formData.couleur === color.value ? 'ring-2 ring-blue-400' : ''
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Order */}
            <div>
              <Label htmlFor="edit-ordre" className="text-sm font-medium text-gray-900 dark:text-white">
                Ordre d'affichage
              </Label>
              <Input
                id="edit-ordre"
                type="number"
                min="1"
                value={formData.ordre}
                onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 1 })}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="edit-type" className="text-sm font-medium text-gray-900 dark:text-white">
                Type de statut
              </Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  {STATUS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active */}
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-actif"
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                className="data-[state=checked]:bg-blue-600"
              />
              <Label htmlFor="edit-actif" className="text-sm font-medium text-gray-900 dark:text-white">
                Actif
              </Label>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={closeModals}
              disabled={saving}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditStatut}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}