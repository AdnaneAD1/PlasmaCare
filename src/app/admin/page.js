'use client'

import { Users, Calendar, TrendingUp, FileText, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminDashboard() {
  const { stats, isLoading, error } = useAdminDashboard();

  const dashboardStats = stats ? [
    {
      id: 1,
      name: 'Clients',
      value: stats.clients.total,
      change: `+${stats.clients.newThisMonth} ce mois`,
      changeType: 'increase',
      icon: Users
    },
    {
      id: 2,
      name: 'Rendez-vous aujourd\'hui',
      value: stats.appointments.today,
      change: `${stats.appointments.thisWeek} cette semaine`,
      changeType: 'neutral',
      icon: Calendar
    },
    {
      id: 3,
      name: 'Programmes actifs',
      value: stats.programs.active,
      change: `${stats.programs.ending} se terminent bientôt`,
      changeType: stats.programs.ending > 0 ? 'warning' : 'neutral',
      icon: TrendingUp
    },
    {
      id: 4,
      name: 'Traitements',
      value: stats.treatments.total,
      change: `${stats.treatments.byCategory.length} catégories`,
      changeType: 'neutral',
      icon: FileText
    }
  ] : [];

  const recentAppointments = stats?.upcomingAppointments || [];

  const popularTreatments = stats?.treatments.mostBooked || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };
  
  // Formater la date pour l'affichage
  const formatAppointmentDate = (dateString) => {
    try {
      // Si la date est au format ISO complet (2025-05-23T00:00:00.000000Z)
      if (dateString.includes('T')) {
        const date = new Date(dateString);
        return format(date, 'dd MMMM yyyy', { locale: fr });
      }
      // Si la date est déjà formatée ou au format YYYY-MM-DD
      else if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const date = new Date(parts[0], parts[1] - 1, parts[2]);
          return format(date, 'dd MMMM yyyy', { locale: fr });
        }
      }
      // Si aucun format reconnu, retourner la chaîne telle quelle
      return dateString;
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <div className="flex flex-col sm:flex-row gap-2">
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat) => (
          <div key={stat.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <span className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
            <p className="text-gray-600">{stat.name}</p>
          </div>
        ))}
      </div>
      )}

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1">
            {stats?.treatments.revenueFromAppointments.toLocaleString('fr-FR')} €
          </h3>
          <p className="text-gray-600">Revenus des rendez-vous confirmés</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1">
            {stats?.treatments.revenueFromPrograms.toLocaleString('fr-FR')} €
          </h3>
          <p className="text-gray-600">Revenus des programmes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Rendez-vous du jour</h2>
              <Link href="/admin/appointments" className="text-primary hover:text-primary/80">
                Voir tout
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentAppointments.map((appointment) => (
              <div key={appointment.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Calendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">{appointment.client_name}</p>
                      <p className="text-sm text-gray-500">
                        {appointment.treatment}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-500">
                      {formatAppointmentDate(appointment.date)} {appointment.time}
                    </p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {translateStatus(appointment.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Treatments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Traitements populaires</h2>
              <Link href="/admin/treatments" className="text-primary hover:text-primary/80">
                Voir tout
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {popularTreatments.map((treatment) => (
              <div key={treatment.name} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">{treatment.name}</p>
                      <p className="text-sm text-gray-500">
                        {treatment.count} réservations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {treatment.count} réservations ce mois
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
