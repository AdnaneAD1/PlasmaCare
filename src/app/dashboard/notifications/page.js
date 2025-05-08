'use client'

import { Bell, Calendar, FileText, MessageCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { EmptyState } from '@/components/ui/EmptyState';
import { initializeNotifications } from '@/services/firebase'
import { useEffect } from 'react';

export default function Notifications() {
  const { notifications, loading, error, markAsRead } = useNotifications();

  useEffect(() => {
    // Vérifier si nous sommes sur iOS Safari
    const isIOSSafari = () => {
      const ua = navigator.userAgent;
      return /iPad|iPhone|iPod/.test(ua) && !window.MSStream && /Safari/.test(ua);
    };
    
    // Ne pas initialiser les notifications sur iOS Safari
    if (!isIOSSafari()) {
      initializeNotifications().catch(error => {
        console.error('Erreur lors de l\'initialisation des notifications:', error)
      });
    } else {
      console.log('Notifications non initialisées sur iOS Safari');
    }
  }, [])

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Chargement des notifications...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'appointment':
        return Calendar;
      case 'diagnosis':
        return FileText;
      case 'message':
        return MessageCircle;
      default:
        return Bell;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'appointment':
        return 'text-blue-500';
      case 'diagnosis':
        return 'text-purple-500';
      case 'message':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button
          className="text-sm text-primary hover:text-primary/80"
          onClick={() => notifications.filter(n => !n.read).forEach(n => handleMarkAsRead(n.id))}
        >
          Tout marquer comme lu
        </button>
      </div>

      {notifications.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`p-6 flex items-start gap-4 ${!notification.read ? 'bg-primary/5' : ''} cursor-pointer`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-opacity-10 flex items-center justify-center ${getIconColor(notification.type)} bg-current`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{notification.body}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-500">{new Date(notification.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          description="Vous n'avez aucune notification pour le moment. Les notifications apparaîtront ici lorsque vous recevrez des mises à jour importantes."
        />
      )}
    </div>
  );
}
