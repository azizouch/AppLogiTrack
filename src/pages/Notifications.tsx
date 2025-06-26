import React, { useState, useEffect, useCallback } from 'react';
import { Bell, RefreshCw, Check, CheckCheck, Trash2, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/supabase';

export function Notifications() {
  const { toast } = useToast();
  const { state } = useAuth();

  // Data state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mockNotifications: Notification[] = [
    {
      id: '1',
      utilisateur_id: 'user1',
      titre: 'Nouveau colis assigné',
      message: 'Un nouveau colis vous a été assigné pour livraison dans la zone Centre-ville.',
      lu: false,
      date_creation: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      type: 'assignment'
    },
    {
      id: '2',
      utilisateur_id: 'user1',
      titre: 'Colis livré avec succès',
      message: 'Le colis #COL123456 a été livré avec succès au client Mohammed Alami.',
      lu: true,
      date_creation: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      type: 'delivery'
    },
    {
      id: '3',
      utilisateur_id: 'user1',
      titre: 'Nouveau client ajouté',
      message: 'Un nouveau client "Entreprise ABC" a été ajouté au système.',
      lu: false,
      date_creation: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      type: 'client'
    },
    {
      id: '4',
      utilisateur_id: 'user1',
      titre: 'Mise à jour système',
      message: 'Le système a été mis à jour avec de nouvelles fonctionnalités.',
      lu: true,
      date_creation: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      type: 'system'
    }
  ];

  // Fetch notifications data
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!state.user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await api.getNotifications(state.user.id);
      if (error) {
        throw error;
      }
      setNotifications(data || []);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement des notifications',
        variant: 'destructive',
      });
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await api.markNotificationAsRead(notificationId);
      if (error) {
        throw error;
      }

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, lu: true }
            : notif
        )
      );

      toast({
        title: 'Notification marquée comme lue',
        description: 'La notification a été marquée comme lue',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer la notification comme lue',
        variant: 'destructive',
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!state.user?.id) return;

    try {
      const { error } = await api.markAllNotificationsAsRead(state.user.id);
      if (error) {
        throw error;
      }

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, lu: true }))
      );

      toast({
        title: 'Toutes les notifications marquées comme lues',
        description: 'Toutes les notifications ont été marquées comme lues',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer toutes les notifications comme lues',
        variant: 'destructive',
      });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await api.deleteNotification(notificationId);
      if (error) {
        throw error;
      }

      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );

      toast({
        title: 'Notification supprimée',
        description: 'La notification a été supprimée avec succès',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la notification',
        variant: 'destructive',
      });
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchNotifications(true);
  };

  // Get notification type color
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'delivery':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'client':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'system':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  // Get notification type label
  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'assignment':
        return 'Assignation';
      case 'delivery':
        return 'Livraison';
      case 'client':
        return 'Client';
      case 'system':
        return 'Système';
      default:
        return 'Général';
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (state.user?.id && (state.user?.role?.toLowerCase() === 'admin' || state.user?.role?.toLowerCase() === 'gestionnaire')) {
      fetchNotifications();
    }
  }, [fetchNotifications, state.user?.id, state.user?.role]);

  const unreadCount = notifications.filter(n => !n.lu).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Centre de notifications {unreadCount > 0 && `(${unreadCount} non lue${unreadCount > 1 ? 's' : ''})`}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-700/10 dark:hover:bg-gray-700/20"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            Toutes les notifications
          </CardTitle>
          <CardDescription>
            Voir toutes les notifications du système ({notifications.length} notification{notifications.length > 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium mb-2">Aucune notification</p>
              <p className="text-sm">Vous n'avez aucune notification pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                    !notification.lu
                      ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      !notification.lu ? 'bg-blue-600' : 'bg-gray-400'
                    }`}></div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-sm font-medium ${
                              !notification.lu
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.titre}
                            </h3>
                            {notification.type && (
                              <Badge className={`text-xs ${getTypeColor(notification.type)}`}>
                                {getTypeLabel(notification.type)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatRelativeTime(notification.date_creation)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {!notification.lu && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              title="Marquer comme lu"
                            >
                              <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer cette notification ?
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteNotification(notification.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
