import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Search, Filter, RefreshCw, Phone, MessageCircle, MapPin, Building, Calendar, Eye, Info, CheckCircle, AlertCircle, Clock, House, Building2, Save, MessageSquare, CircleAlert, X, Send, Mail, RotateCcw, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/contexts/AuthContext';
import { api, supabase } from '@/lib/supabase';

import { Colis, HistoriqueColis, Statut } from '@/types';
import { useToast } from '@/hooks/use-toast';

type MesColisProps = {
  initialStatus?: string;
  pageTitle?: string;
  pageDescription?: string;
};

export function MesColis({
  initialStatus = 'tous',
  pageTitle = 'Mes Colis',
  pageDescription = 'Vue détaillée de vos colis avec filtres et tri',
}: MesColisProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAuth();
  const { toast } = useToast();

  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sortBy, setSortBy] = useState('recent');
  const [dateFilter, setDateFilter] = useState('toutes');
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [selectedColisEtat, setSelectedColisEtat] = useState('Non Payé');
  const [showReclamationModal, setShowReclamationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuiviModal, setShowSuiviModal] = useState(false);
  const [suiviHistory, setSuiviHistory] = useState<HistoriqueColis[]>([]);
  const [loadingSuivi, setLoadingSuivi] = useState(false);
  const [reclamationText, setReclamationText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [currentReportDate, setCurrentReportDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchColis = async (isRefresh = false) => {
    if (!state.user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (debouncedSearchTerm) {
        // When searching, use a broader query that includes related data
        const searchTerm = `%${debouncedSearchTerm}%`;

        // Get all colis for this livreur first
        const { data: allColis, error: allError } = await supabase
          .from('colis')
          .select(`
            *,
            client:clients(*),
            entreprise:entreprises(*),
            livreur:utilisateurs(*)
          `)
          .eq('livreur_id', state.user.id);

        if (allError) {
          console.error('Error fetching all colis:', allError);
          setColis([]);
          setTotalCount(0);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        // Filter results client-side
        let filteredColis = (allColis || []).filter(colis => {
          const searchLower = debouncedSearchTerm.toLowerCase();
          return (
            colis.id.toLowerCase().includes(searchLower) ||
            (colis.client?.nom && colis.client.nom.toLowerCase().includes(searchLower)) ||
            (colis.client?.telephone && colis.client.telephone.toLowerCase().includes(searchLower)) ||
            (colis.entreprise?.nom && colis.entreprise.nom.toLowerCase().includes(searchLower))
          );
        });

        // Apply status filter
        if (statusFilter !== 'tous') {
          const isRelanceAutreGroup = ['Relancé nouveau client', 'Relancé Autre Client'].includes(statusFilter);
          if (isRelanceAutreGroup) {
            filteredColis = filteredColis.filter(c => ['Relancé nouveau client', 'Relancé Autre Client'].includes(c.statut));
          } else {
            filteredColis = filteredColis.filter(c => c.statut === statusFilter);
          }
        }

        // Apply date filter
        if (dateFilter !== 'toutes') {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          filteredColis = filteredColis.filter(colis => {
            const colisDate = new Date(colis.date_creation);
            const colisDateOnly = new Date(colisDate.getFullYear(), colisDate.getMonth(), colisDate.getDate());

            switch (dateFilter) {
              case 'aujourd_hui':
                return colisDateOnly.getTime() === today.getTime();
              case 'hier':
                return colisDateOnly.getTime() === yesterday.getTime();
              case '7_derniers_jours':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return colisDateOnly >= sevenDaysAgo;
              case '30_derniers_jours':
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return colisDateOnly >= thirtyDaysAgo;
              case 'ce_mois':
                return colisDate.getMonth() === now.getMonth() && colisDate.getFullYear() === now.getFullYear();
              case 'le_mois_dernier':
                const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                return colisDate.getMonth() === lastMonth && colisDate.getFullYear() === lastMonthYear;
              case 'periode_personnalisee':
                // For now, treat as "all dates" - could be extended with date picker
                return true;
              default:
                return true;
            }
          });
        }

        // Apply sorting
        if (sortBy === 'recent') {
          filteredColis.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
        } else if (sortBy === 'oldest') {
          filteredColis.sort((a, b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime());
        } else if (sortBy === 'status') {
          filteredColis.sort((a, b) => (a.statut || '').localeCompare(b.statut || ''));
        }

        // Apply pagination
        const totalCount = filteredColis.length;
        const from = (currentPage - 1) * entriesPerPage;
        const to = from + entriesPerPage;
        const paginatedResults = filteredColis.slice(from, to);

        setColis(paginatedResults);
        setTotalCount(totalCount);
      } else {
        // Normal query without search
        let query = supabase
          .from('colis')
          .select(`
            *,
            client:clients(*),
            entreprise:entreprises(*),
            livreur:utilisateurs(*)
          `, { count: 'exact' })
          .eq('livreur_id', state.user.id);

        // Apply status filter
        if (statusFilter !== 'tous') {
          const isRelanceAutreGroup = ['Relancé nouveau client', 'Relancé Autre Client'].includes(statusFilter);
          if (isRelanceAutreGroup) {
            query = query.in('statut', ['Relancé nouveau client', 'Relancé Autre Client']);
          } else {
            query = query.eq('statut', statusFilter);
          }
        }

        // Apply date filter
        if (dateFilter !== 'toutes') {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          switch (dateFilter) {
            case 'aujourd_hui':
              const todayStart = new Date(today);
              const todayEnd = new Date(today);
              todayEnd.setHours(23, 59, 59, 999);
              query = query.gte('date_creation', todayStart.toISOString()).lte('date_creation', todayEnd.toISOString());
              break;
            case 'hier':
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStart = new Date(yesterday);
              const yesterdayEnd = new Date(yesterday);
              yesterdayEnd.setHours(23, 59, 59, 999);
              query = query.gte('date_creation', yesterdayStart.toISOString()).lte('date_creation', yesterdayEnd.toISOString());
              break;
            case '7_derniers_jours':
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              query = query.gte('date_creation', sevenDaysAgo.toISOString());
              break;
            case '30_derniers_jours':
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              query = query.gte('date_creation', thirtyDaysAgo.toISOString());
              break;
            case 'ce_mois':
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
              const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
              query = query.gte('date_creation', monthStart.toISOString()).lte('date_creation', monthEnd.toISOString());
              break;
            case 'le_mois_dernier':
              const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
              const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
              const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
              const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999);
              query = query.gte('date_creation', lastMonthStart.toISOString()).lte('date_creation', lastMonthEnd.toISOString());
              break;
            case 'periode_personnalisee':
              // For now, no filtering - could be extended with date picker
              break;
          }
        }

        // Apply sorting
        if (sortBy === 'recent') {
          query = query.order('date_creation', { ascending: false });
        } else if (sortBy === 'oldest') {
          query = query.order('date_creation', { ascending: true });
        } else if (sortBy === 'status') {
          query = query.order('statut');
        }

        // Apply pagination
        const from = (currentPage - 1) * entriesPerPage;
        const to = from + entriesPerPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
          console.error('MesColis: Query error:', error);
          setColis([]);
          setTotalCount(0);
        } else {
          setColis(data || []);
          setTotalCount(count || 0);
        }
      }
    } catch (error: any) {
      console.error('Error in fetchColis:', error);
      setColis([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStatuts = async () => {
    try {
      const { data, error } = await supabase
        .from('statuts')
        .select('id, nom, couleur, type, actif, created_at')
        .eq('type', 'colis')
        .eq('actif', true)
        .order('ordre', { ascending: true });

      if (!error && data) {
        setStatuts(data as Statut[]);
      } else {
        console.error('Error fetching statuts:', error);
      }
    } catch (error) {
      console.error('MesColis: Exception fetching statuts:', error);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchStatuts();
  }, []);

  // Initial load useEffect
  useEffect(() => {
    if (state.user?.id && !isInitialized) {
      setIsInitialized(true);
      fetchColis();
    }
  }, [state.user?.id, isInitialized]);

  // Keep status filter in sync with initial status
  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  // Filter changes useEffect
  useEffect(() => {
    if (state.user?.id && isInitialized) {
      fetchColis();
    }
  }, [debouncedSearchTerm, statusFilter, sortBy, dateFilter, currentPage, entriesPerPage, isInitialized]);

  const getStatusColor = (statut: string) => {
    const statutData = statuts.find(s => s.nom === statut);
    if (statutData) {
      return `text-white`;
    }

    // Fallback colors for unknown status
    switch (statut) {
      case 'Livré':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'En cours de livraison':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Pris en charge':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Refusé':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Annulé':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getColorClass = (couleur: string) => {
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-500 text-white',
      'green': 'bg-green-500 text-white',
      'red': 'bg-red-500 text-white',
      'yellow': 'bg-yellow-500 text-black',
      'orange': 'bg-orange-500 text-white',
      'purple': 'bg-purple-500 text-white',
      'pink': 'bg-pink-500 text-white',
      'gray': 'bg-gray-500 text-white',
      'teal': 'bg-teal-500 text-white',
      'indigo': 'bg-indigo-500 text-white',
      'lime': 'bg-lime-500 text-black',
      'cyan': 'bg-cyan-500 text-white',
      'amber': 'bg-amber-500 text-black',
    };
    return colorMap[couleur] || 'bg-gray-500 text-white';
  };

  const getEtatBadgeClass = (etat: string) => {
    switch ((etat || '').toLowerCase()) {
      case 'payé':
      case 'paye':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300';
      case 'non payé':
      case 'non paye':
      case 'unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-300';
    }
  };

  const getActionParLabel = (item: HistoriqueColis) => {
    const role = item.user?.role?.toLowerCase();
    if (role === 'admin') {
      return 'Logitrack Admin';
    }
    if (role === 'gestionnaire') {
      return 'Logitrack Gestionnaire';
    }
    if (role === 'livreur') {
      return `${item.user?.prenom ?? ''} ${item.user?.nom ?? ''}`.trim() || 'Livreur';
    }
    if (item.user?.prenom || item.user?.nom) {
      return `${item.user?.prenom ?? ''} ${item.user?.nom ?? ''}`.trim();
    }
    if (item.utilisateur) {
      return item.utilisateur;
    }
    return 'Système';
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'livre':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'en_cours':
      case 'pris_en_charge':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'mise_en_distribution':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter(initialStatus);
    setSortBy('recent');
    setDateFilter('toutes');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || (initialStatus === 'tous' && statusFilter !== 'tous') || sortBy !== 'recent' || dateFilter !== 'toutes';

  const totalPages = Math.ceil(totalCount / entriesPerPage);

  // Modal handlers
  const handleReclamation = (colisItem: Colis) => {
    setSelectedColis(colisItem);
    setShowReclamationModal(true);
  };

  const handleSuivi = async (colisItem: Colis) => {
    setSelectedColis(colisItem);
    setShowSuiviModal(true);
    setLoadingSuivi(true);
    try {
      const [historyResult, bonResult] = await Promise.all([
        supabase
          .from('historique_colis')
          .select(`
            id,
            colis_id,
            date,
            statut,
            utilisateur,
            informations,
            user:utilisateurs(role, nom, prenom)
          `)
          .eq('colis_id', colisItem.id)
          .order('date', { ascending: false }),
        supabase
          .from('bon_colis')
          .select('bon:bons(type, statut)')
          .eq('colis_id', colisItem.id),
      ]);

      if (historyResult.error) {
        console.error('Error fetching suivi history:', historyResult.error);
        setSuiviHistory([]);
      } else {
        const historyData: HistoriqueColis[] = (historyResult.data || []).map((item: any) => ({
          ...item,
          user: Array.isArray(item.user) ? item.user[0] : item.user,
        }));
        setSuiviHistory(historyData);
      }

      if (bonResult.error) {
        console.error('Error fetching colis payment state:', bonResult.error);
        setSelectedColisEtat('Non Payé');
      } else {
        const hasPaidBon = (bonResult.data || []).some((entry: any) => {
          const bonType = entry?.bon?.type?.toLowerCase();
          const bonStatut = entry?.bon?.statut?.toLowerCase();
          return bonType === 'paiement' && ['complété', 'complete', 'payé', 'paye', 'paid'].includes(bonStatut);
        });

        setSelectedColisEtat(hasPaidBon ? 'Payé' : 'Non Payé');
      }
    } catch (error) {
      console.error('Error fetching suivi history:', error);
      setSuiviHistory([]);
      setSelectedColisEtat('Non Payé');
    } finally {
      setLoadingSuivi(false);
    }
  };

  const handleWhatsApp = (colisItem: Colis) => {
    if (colisItem.client?.telephone) {
      let phoneNumber = colisItem.client.telephone.replace(/\D/g, ''); // Remove all non-digits

      // Handle Moroccan phone numbers
      if (phoneNumber.startsWith('0')) {
        // Remove leading 0 and add Moroccan country code
        phoneNumber = '212' + phoneNumber.substring(1);
      } else if (phoneNumber.length === 9 && !phoneNumber.startsWith('212')) {
        // If it's 9 digits without country code, add Moroccan country code
        phoneNumber = '212' + phoneNumber;
      }
      // If it already has country code or is in correct format, use as is

      const message = `مرحباً، بخصوص طردكم ${colisItem.id}`;
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleSMS = (colisItem: Colis) => {
    if (colisItem.client?.telephone) {
      let phoneNumber = colisItem.client.telephone.replace(/\D/g, ''); // Remove all non-digits

      // Handle Moroccan phone numbers
      if (phoneNumber.startsWith('0')) {
        // Remove leading 0 and add Moroccan country code
        phoneNumber = '212' + phoneNumber.substring(1);
      } else if (phoneNumber.length === 9 && !phoneNumber.startsWith('212')) {
        // If it's 9 digits without country code, add Moroccan country code
        phoneNumber = '212' + phoneNumber;
      }

      const message = `Bonjour, concernant votre colis ${colisItem.id}`;
      window.open(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleCall = (colisItem: Colis) => {
    if (colisItem.client?.telephone) {
      let phoneNumber = colisItem.client.telephone;

      // For calling, keep the original format but ensure it's clean
      phoneNumber = phoneNumber.replace(/\s+/g, ''); // Remove spaces

      window.open(`tel:${phoneNumber}`, '_blank');
    }
  };

  const handleViewDetails = (colisItem: Colis) => {
    setSelectedColis(colisItem);
    setShowDetailsModal(true);
  };

  const loadReportDateForColis = async (colisId: string) => {
    try {
      const { data, error } = await supabase
        .from('historique_colis')
        .select('informations')
        .eq('colis_id', colisId)
        .eq('statut', 'Reporté')
        .order('date', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const informations = data[0].informations;
        if (informations?.startsWith('Reporté pour le')) {
          const dateMatch = informations.match(/Reporté pour le\s+(\d{2})\/(\d{2})\/(\d{4})/);
          if (dateMatch) {
            const [, day, month, year] = dateMatch;
            const dateStr = `${year}-${month}-${day}`;
            setCurrentReportDate(dateStr);
            setReportDate(dateStr);
          }
        }
      }
    } catch (error) {
      console.error('Error loading report date:', error);
    }
  };

  const handleStatusChange = async (colisItem: Colis) => {
    setSelectedColis(colisItem);
    setNewStatus(colisItem.statut || '');
    setStatusNote('');
    setReportDate('');
    setCurrentReportDate('');

    if (colisItem.statut === 'Reporté') {
      await loadReportDateForColis(colisItem.id);
    }

    setShowStatusModal(true);
  };

  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const updateColisStatus = async () => {
    if (!selectedColis || !newStatus) return;

    setIsUpdating(true);
    try {
      // Update colis status
      if (newStatus === 'Reporté' && !reportDate) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner une date de report.',
          variant: 'destructive',
        });
        setIsUpdating(false);
        return;
      }

      // Validate that the date is not in the past
      if (newStatus === 'Reporté' && reportDate) {
        const selectedDate = new Date(reportDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          toast({
            title: 'Erreur',
            description: 'Vous ne pouvez pas sélectionner une date passée. Veuillez choisir une date à partir d\'aujourd\'hui.',
            variant: 'destructive',
          });
          setIsUpdating(false);
          return;
        }
      }

      // Check if status is staying "Reporté" and date is being changed
      const isStatusUnchanged = selectedColis.statut === newStatus;
      const isReportDateChanged = newStatus === 'Reporté' && reportDate && selectedColis.statut === 'Reporté';

      // Only update the colis status if it's actually changing
      if (!isStatusUnchanged) {
        const { error } = await api.updateColis(selectedColis.id, {
          statut: newStatus
        });

        if (error) {
          toast({
            title: 'Erreur',
            description: 'Impossible de mettre à jour le statut',
            variant: 'destructive',
          });
          return;
        }
      }

      // Get current user for historique
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      // Find the corresponding utilisateur record using the auth_id field
      let utilisateurId = null;
      if (currentUserId) {
        const { data: utilisateur, error: userError } = await supabase
          .from('utilisateurs')
          .select('id, nom, prenom, role, auth_id')
          .eq('auth_id', currentUserId)
          .maybeSingle();

        if (!userError && utilisateur) {
          utilisateurId = utilisateur.id;
        }
      }

      // Add to historique only if we have a valid utilisateur and either status changed or date changed
      if (utilisateurId && (!isStatusUnchanged || isReportDateChanged)) {
        const historiqueEntry: any = {
          colis_id: selectedColis.id,
          statut: newStatus,
          date: new Date().toISOString(),
          utilisateur: utilisateurId
        };

        const noteParts: string[] = [];
        if (newStatus === 'Reporté' && reportDate) {
          noteParts.push(`Reporté pour le ${formatDate(reportDate)}`);
        }
        if (statusNote.trim()) {
          noteParts.push(statusNote.trim());
        }
        if (noteParts.length > 0) {
          historiqueEntry.informations = noteParts.join(' — ');
        }

        const { error: historiqueError } = await supabase
          .from('historique_colis')
          .insert(historiqueEntry);

        if (historiqueError) {
          console.error('Error inserting historique:', historiqueError);
          // Don't throw here - we still want the status update to succeed
          toast({
            title: 'Avertissement',
            description: 'Le statut a été mis à jour mais l\'historique n\'a pas pu être enregistré',
            variant: 'destructive',
          });
        }
      } else {
        console.error('No utilisateur ID found - inserting historique without utilisateur');
        // Try inserting without utilisateur field
        const historiqueEntry: any = {
          colis_id: selectedColis.id,
          statut: newStatus,
          date: new Date().toISOString()
        };

        const noteParts: string[] = [];
        if (newStatus === 'Reporté' && reportDate) {
          noteParts.push(`Reporté pour le ${formatDate(reportDate)}`);
        }
        if (statusNote.trim()) {
          noteParts.push(statusNote.trim());
        }
        if (noteParts.length > 0) {
          historiqueEntry.informations = noteParts.join(' — ');
        }

        const { error: historiqueError } = await supabase
          .from('historique_colis')
          .insert(historiqueEntry);

        if (historiqueError) {
          console.error('Error inserting historique without utilisateur:', historiqueError);
          toast({
            title: 'Avertissement',
            description: 'Le statut a été mis à jour mais l\'historique n\'a pas pu être enregistré (utilisateur non trouvé)',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Succès',
        description: isReportDateChanged ? 'Date de report mise à jour avec succès' : 'Statut mis à jour avec succès',
      });
      setShowStatusModal(false);
      fetchColis(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const submitReclamation = async () => {
    if (!selectedColis || !reclamationText.trim() || !state.user) {
      return;
    }

    try {
      // Get admin and gestionnaire users to notify
      const { data: adminUsers, error: adminError } = await api.getAdminAndGestionnaireUsers();

      if (adminError) {
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les administrateurs',
          variant: 'destructive',
        });
        return;
      }

      // Create notifications for each admin/gestionnaire
      if (adminUsers && adminUsers.length > 0) {
        const notificationPromises = adminUsers.map(admin =>
          api.createNotification({
            utilisateur_id: admin.id,
            titre: 'Nouvelle réclamation',
            message: `Le livreur ${state.user.prenom} ${state.user.nom} a envoyé une réclamation pour le colis ${selectedColis.id}: "${reclamationText.substring(0, 100)}${reclamationText.length > 100 ? '...' : ''}"`,
            lu: false,
            type: 'reclamation'
          })
        );

        const results = await Promise.all(notificationPromises);

        // Check if any notifications failed
        const failures = results.filter(r => r.error);
        if (failures.length > 0) {
          console.error('Some notifications failed:', failures);
          toast({
            title: 'Réclamation envoyée',
            description: 'Réclamation envoyée mais certaines notifications ont échoué',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Réclamation envoyée',
            description: 'Votre réclamation a été envoyée avec succès',
          });
        }
      } else {
        // No admin users found - let's check what users exist
        const { data: allUsers } = await supabase
          .from('utilisateurs')
          .select('id, nom, prenom, role, statut, email')
          .limit(10);

        toast({
          title: 'Réclamation envoyée',
          description: 'Réclamation enregistrée (aucun administrateur trouvé)',
        });
      }

      setShowReclamationModal(false);
      setReclamationText('');
    } catch (error) {
      console.error('Error submitting reclamation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la réclamation',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (text) => {
    return text
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const renderInformations = (informations?: string) => {
    if (!informations) {
      return <span className="text-gray-600 dark:text-gray-300">Mise à jour du statut du colis.</span>;
    }

    // Check if it starts with "Reporté pour le"
    if (informations.startsWith('Reporté pour le')) {
      // Extract "Reporté pour le" label and the rest
      const labelMatch = informations.match(/^Reporté pour le\s+(.+?)(?:\s+—\s+(.+))?$/);
      
      if (labelMatch) {
        const dateAndRest = labelMatch[1]; // "DD/MM/YYYY" or "DD/MM/YYYY — note"
        const additionalNote = labelMatch[2]; // optional additional note

        return (
          <div className="text-gray-700 dark:text-gray-200">
            <span className="font-bold text-black dark:text-white">Reporté pour le</span>
            <span className="text-gray-600 dark:text-gray-300"> : {dateAndRest}</span>
            {additionalNote && (
              <>
                <span className="text-gray-600 dark:text-gray-300"> — </span>
                <span className="text-gray-600 dark:text-gray-300">{additionalNote}</span>
              </>
            )}
          </div>
        );
      }
    }

    // Default rendering for non-report statuses
    return <span className="text-gray-600 dark:text-gray-300">{informations}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
        <p className="text-gray-600 dark:text-gray-400">{pageDescription}</p>
      </div>
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchColis(true)}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="text-sm"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Actualiser
            </Button>

            {hasActiveFilters && (
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                <X className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {initialStatus === 'tous' && (
            <div className="space-y-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  {statuts.map((statut) => (
                    <SelectItem key={statut.id} value={statut.nom}>
                      {statut.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Plus récent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récent</SelectItem>
                <SelectItem value="oldest">Plus ancien</SelectItem>
                <SelectItem value="status">Par statut</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Toutes les dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les dates</SelectItem>
                <SelectItem value="aujourd_hui">Aujourd'hui</SelectItem>
                <SelectItem value="hier">Hier</SelectItem>
                <SelectItem value="7_derniers_jours">7 derniers jours</SelectItem>
                <SelectItem value="30_derniers_jours">30 derniers jours</SelectItem>
                <SelectItem value="ce_mois">Ce mois</SelectItem>
                <SelectItem value="le_mois_dernier">Le mois dernier</SelectItem>
                <SelectItem value="periode_personnalisee">Période personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Colis Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">Chargement des colis...</p>
          </div>
        ) : colis.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun colis trouvé</h3>
            <p className="text-gray-500 dark:text-gray-400">Vous n'avez actuellement aucun colis assigné.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colis.map((colisItem) => (
              <Card key={colisItem.id} className="rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden border hover:shadow-md transition-all">
                <CardContent className="p-0">
                  {/* Header with ID and Date */}
                  <div className="flex justify-between items-center p-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{colisItem.id}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(colisItem.date_creation).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{colisItem.client?.nom || 'Client inconnu'}</h3>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1 inline" />
                          <span>{colisItem.client?.telephone || 'N/A'}</span>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <House className="h-3 w-3 mr-1 inline" />
                          <span>{colisItem.adresse_livraison || 'Adresse non spécifiée'}</span>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1 inline" />
                          <span>Casablanca</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <StatusBadge statut={colisItem.statut} statuts={statuts} />
                    </div>

                    {/* Company and Price */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Building2 className="h-3 w-3 mr-1 inline" />
                        <span>{colisItem.entreprise?.nom || 'N/A'}</span>
                      </div>
                      <div className="text-xl font-bold">
                        {colisItem.prix ? `${colisItem.prix} DH` : '0 DH'}
                        {colisItem.frais && <span className="text-sm text-muted-foreground"> (+{colisItem.frais} frais)</span>}
                      </div>
                    </div>

                    {/* Contact Buttons */}
                    <div className="mt-4 mb-4">
                      <div className="grid grid-cols-4 sm:grid-cols-2 gap-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          <span className="sm:hidden">{getInitials("Vendeur B")}</span>
                          <span className="hidden sm:inline">Vendeur B</span>
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          <span className="sm:hidden">{getInitials("Vendeur B")}</span>
                          <span className="hidden sm:inline">Vendeur B</span>
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          <span className="sm:hidden">{getInitials("Vendeur P")}</span>
                          <span className="hidden sm:inline">Vendeur P</span>
                        </Button>
                        <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          <span className="sm:hidden">{getInitials("Vendeur P")}</span>
                          <span className="hidden sm:inline">Vendeur P</span>
                        </Button>
                      </div>
                    </div>

                    {/* Status Change Button - Hidden for delivered packages */}
                    {colisItem.statut !== 'Livré' && colisItem.statut !== 'livre' && (
                      <div className="mb-4">
                        <Button
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => handleStatusChange(colisItem)}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Changer le statut
                        </Button>
                      </div>
                    )}

                    {/* Bottom Action Icons */}
                    <div className="flex justify-center gap-3 pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800"
                        onClick={() => handleSuivi(colisItem)}
                      >
                        <History className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800"
                        onClick={() => handleReclamation(colisItem)}
                      >
                        <Info className="h-4 w-4 text-cyan-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"
                        onClick={() => handleWhatsApp(colisItem)}
                      >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800"
                        onClick={() => handleSMS(colisItem)}
                      >
                        <Mail className="h-4 w-4 text-yellow-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800"
                        onClick={() => handleCall(colisItem)}
                      >
                        <Phone className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/40 border border-gray-200 dark:border-gray-800"
                        onClick={() => handleViewDetails(colisItem)}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && colis.length > 0 && totalCount > entriesPerPage && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Affichage de {((currentPage - 1) * entriesPerPage) + 1} à {Math.min(currentPage * entriesPerPage, totalCount)} sur {totalCount} résultats
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Réclamation Modal */}
      <Dialog open={showReclamationModal} onOpenChange={setShowReclamationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer une réclamation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Colis ID: <span className="font-medium text-foreground">{selectedColis?.id}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Client: <span className="font-medium text-foreground">{selectedColis?.client?.nom}</span>
              </p>
            </div>
            <Textarea
              placeholder="Décrivez votre réclamation ici..."
              value={reclamationText}
              onChange={(e) => setReclamationText(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setShowReclamationModal(false)}>
              Annuler
            </Button>
            <Button onClick={submitReclamation} disabled={!reclamationText.trim()}>
              <Send className="mr-2 h-5 w-5" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suivi du Colis Modal */}
      <Dialog open={showSuiviModal} onOpenChange={setShowSuiviModal}>
        <DialogContent className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-7xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <History className="h-5 w-5" />
              Détails du suivi
            </DialogTitle>
            <DialogDescription>
              Historique des statuts et actions liées au colis {selectedColis?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-3 px-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 shadow-lg dark:border-gray-800 p-4 lg:p-3 bg-white dark:bg-slate-950">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Code d'envoi</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">{selectedColis?.id || 'N/A'}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 shadow-lg dark:border-gray-800 p-4 lg:p-3  bg-white dark:bg-slate-950">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Client</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedColis?.client?.nom || 'N/A'}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 shadow-lg dark:border-gray-800 p-3  bg-white dark:bg-slate-950">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">État du colis</h3>
                  <div className="inline-flex items-center gap-2">
                    <Badge className={`${getEtatBadgeClass(selectedColisEtat)} text-xs py-1 px-2 hover:bg-transparent`}>{selectedColisEtat}</Badge>
                  </div>
                </div>
              </div>

              {loadingSuivi ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2 text-sm">Chargement du suivi...</p>
                </div>
              ) : suiviHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 sm:p-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Aucun historique de suivi disponible pour ce colis.
                </div>
              ) : (
                <div>
                  <div className="space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-6 gap-1 sm:gap-4 items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-950 px-1 sm:px-4 py-1 sm:py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span>Code d'envoi</span>
                      <span>État</span>
                      <span>Status</span>
                      <span>Date</span>
                      <span>Informations</span>
                      <span>Action</span>
                    </div>
                    <div className="space-y-2">
                      {suiviHistory.map((item) => (
                        <div key={item.id} className="border rounded-xl shadow-md dark:border-gray-800 bg-white dark:bg-slate-950 dark:shadow-sm p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          <div className="block sm:hidden space-y-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Code d'envoi</div>
                                <div className="font-medium break-all">{item.colis_id || selectedColis?.id || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Date</div>
                                <div className="text-muted-foreground">{formatDateTime(item.date)}</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">État</div>
                                <Badge className={`${getEtatBadgeClass(selectedColisEtat)} text-xs py-1 px-2 hover:bg-transparent`}>{selectedColisEtat}</Badge>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Status</div>
                                <div><StatusBadge statut={item.statut} statuts={statuts} /></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Infos</div>
                                <div>{renderInformations(item.informations)}</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-black dark:text-white font-bold">Action par</div>
                                <div className="font-medium">{getActionParLabel(item)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-6 gap-1 sm:gap-4 items-center">
                            <span className="font-medium break-all">{item.colis_id || selectedColis?.id || 'N/A'}</span>
                            <Badge className={`${getEtatBadgeClass(selectedColisEtat)} text-xs py-1 px-2 hover:bg-transparent`}>{selectedColisEtat}</Badge>
                            <div className="flex items-center justify-start"><StatusBadge statut={item.statut} statuts={statuts} /></div>
                            <span className="text-muted-foreground">{formatDateTime(item.date)}</span>
                            <div>{renderInformations(item.informations)}</div>
                            <span className="font-medium truncate">{getActionParLabel(item)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowSuiviModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Colis Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Détails du Colis
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur le colis et options de gestion
            </DialogDescription>
          </DialogHeader>

          {selectedColis && (
            <div className="space-y-4 py-3">
              {/* Colis Information */}
              <div>
                <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Informations du Colis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">ID Colis</h4>
                    <p className="font-mono bg-muted p-1 rounded text-xs">{selectedColis.id}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Date</h4>
                    <p>{new Date(selectedColis.date_creation).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Statut</h4>
                    <StatusBadge statut={selectedColis.statut} statuts={statuts} />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Prix</h4>
                    <p className="font-semibold">{selectedColis.prix || 0} DH</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Frais</h4>
                    <p>{selectedColis.frais > 0 ? `${selectedColis.frais} DH` : 'Aucun'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Total</h4>
                    <p className="font-bold">{(selectedColis.prix || 0) + (selectedColis.frais || 0)} DH</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Information */}
                <div>
                  <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    Client
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Nom</h4>
                      <p>{selectedColis.client?.nom || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Téléphone</h4>
                      <p>{selectedColis.client?.telephone || 'Non disponible'}</p>
                    </div>

                    {selectedColis.adresse_livraison && selectedColis.adresse_livraison !== '' && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground">Adresse</h4>
                        <p>{selectedColis.adresse_livraison}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Ville</h4>
                      <p>Casablanca</p>
                    </div>

                    {selectedColis.client?.telephone && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground">Contacts</h4>
                        <div className="flex gap-2 mt-1">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleCall(selectedColis)} title="Appeler">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleSMS(selectedColis)} title="SMS">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleWhatsApp(selectedColis)} title="WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Entreprise Information */}
                <div>
                  <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    Entreprise
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Nom</h4>
                      <p>{selectedColis.entreprise?.nom !== 'N/A' ? selectedColis.entreprise?.nom : 'Aucune entreprise associée'}</p>
                    </div>

                    {selectedColis.entreprise?.nom !== 'N/A' && selectedColis.entreprise?.nom && (
                      <>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">Email</h4>
                          <p>{selectedColis.entreprise?.email || `contact@${selectedColis.entreprise?.nom.toLowerCase().replace(/\s+/g, '')}.com`}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">Téléphone</h4>
                          <p>{selectedColis.entreprise?.telephone || '+212 5XX-XXXXXX'}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">Adresse</h4>
                          <p>{selectedColis.entreprise?.adresse || 'Casablanca, Maroc'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor Contacts */}
              <div>
                <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contacts Vendeurs
                </h3>
                <div className="space-y-3">
                  {/* Vendeur B */}
                  {selectedColis.entreprise?.telephone && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Vendeur B</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{selectedColis.entreprise.telephone}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => window.open(`tel:${selectedColis.entreprise?.telephone}`, '_self')}
                        >
                          <Phone className="mr-1 h-3 w-3" />
                          Vendeur B
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => window.open(`https://wa.me/${selectedColis.entreprise?.telephone?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <MessageCircle className="mr-1 h-3 w-3" />
                          Vendeur B
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Vendeur P */}
                  {selectedColis.entreprise?.telephone_2 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Vendeur P</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{selectedColis.entreprise.telephone_2}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => window.open(`tel:${selectedColis.entreprise?.telephone_2}`, '_self')}
                        >
                          <Phone className="mr-1 h-3 w-3" />
                          Vendeur P
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                          onClick={() => window.open(`https://wa.me/${selectedColis.entreprise?.telephone_2?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <MessageCircle className="mr-1 h-3 w-3" />
                          Vendeur P
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* No phone numbers available */}
                  {!selectedColis.entreprise?.telephone && !selectedColis.entreprise?.telephone_2 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Aucun numéro de téléphone disponible pour cette entreprise
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailsModal(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Save className="mr-2 h-5 w-5" />
              Changer le statut du colis
            </DialogTitle>
            <DialogDescription>
              Mettre à jour le statut du colis #{selectedColis?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Statut actuel:</p>
                {selectedColis && (
                  <div><StatusBadge statut={selectedColis.statut || 'En attente'} statuts={statuts} /></div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStatus">Nouveau statut</Label>
              <Select
                defaultValue={selectedColis?.statut}
                value={newStatus}
                onValueChange={setNewStatus}
              >
                <SelectTrigger id="newStatus">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuts && statuts.length > 0 ? (
                    statuts.map((status) => (
                      <SelectItem key={status.id} value={status.nom}>
                        {status.nom}
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback options if statuses aren't loaded
                    <>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="Pris en charge">Pris en charge</SelectItem>
                      <SelectItem value="En cours de livraison">En cours de livraison</SelectItem>
                      <SelectItem value="Livré">Livré</SelectItem>
                      <SelectItem value="Refusé">Refusé</SelectItem>
                      <SelectItem value="Annulé">Annulé</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'Reporté' && (
              <div className="space-y-2">
                <Label htmlFor="reportDate">Date de report</Label>
                <Input
                  id="reportDate"
                  type="date"
                  min={getMinDate()}
                  value={reportDate}
                  className="dark:bg-slate-900 dark:text-white dark:border-gray-700 dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:brightness-200"
                  onChange={(e) => {
                    const selected = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (selected < today) {
                      toast({
                        title: 'Erreur',
                        description: 'Vous ne pouvez pas sélectionner une date passée. Veuillez choisir une date à partir d\'aujourd\'hui.',
                        variant: 'destructive',
                      });
                    } else {
                      setReportDate(e.target.value);
                    }
                  }}
                />
              </div>
            )}

            {/* <div className="space-y-2">
              <Label htmlFor="statusNote">Note (optionnel)</Label>
              <Textarea
                id="statusNote"
                placeholder="Ajouter une note concernant le changement de statut..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div> */}
          </div>

          <DialogFooter
            className='gap-2'>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={updateColisStatus}
              disabled={isUpdating || (newStatus === selectedColis?.statut && (!reportDate || reportDate === currentReportDate))}
            >
              {isUpdating ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Mettre à jour
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
