'use client'

import { useState } from 'react';
import { Calendar, Clock, Plus, User } from 'lucide-react';
import { AdminAppointmentForm } from '../../../components/forms/AdminAppointmentForm';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { useAppointments } from '@/hooks/useAppointments';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminAppointments() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const { appointments, isLoading, error, deleteAppointment, updateAppointmentStatus, refreshAppointments } = useAppointments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Chargement des rendez-vous...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleDelete = async (appointmentId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await deleteAppointment(appointmentId);
        await refreshAppointments();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Une erreur est survenue lors de la suppression du rendez-vous.');
      }
    }
  };

  const handleCancel = async (appointmentId) => {
    if (confirm('Voulez-vous annuler ce rendez-vous ?')) {
      try {
        await updateAppointmentStatus(appointmentId, 'cancelled');
        await refreshAppointments();
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error);
        alert('Une erreur est survenue lors de l\'annulation du rendez-vous.');
      }
    }
  };
  
  // Fonction pour formater la date correctement
  const formatAppointmentDate = (dateString) => {
    try {
      // Si la date est au format ISO complet (2025-05-23T00:00:00.000000Z)
      if (typeof dateString === 'string' && dateString.includes('T')) {
        const date = new Date(dateString);
        return format(date, 'dd MMMM yyyy', { locale: fr });
      }
      // Si la date est un objet Date
      else if (dateString instanceof Date) {
        return format(dateString, 'dd MMMM yyyy', { locale: fr });
      }
      // Si la date est au format YYYY-MM-DD
      else if (typeof dateString === 'string' && dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const date = new Date(parts[0], parts[1] - 1, parts[2]);
          return format(date, 'dd MMMM yyyy', { locale: fr });
        }
      }
      // Si aucun format reconnu, utiliser toLocaleDateString comme fallback
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error, dateString);
      // En cas d'erreur, retourner la chaîne telle quelle
      return dateString;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Gestion des rendez-vous</h1>
        <button
          onClick={() => {
            setEditingAppointment(null);
            setIsFormOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau rendez-vous
        </button>
      </div>

      {(appointments || []).length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="grid divide-y">
            {(appointments || []).map((appointment) => (
              <div key={appointment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatAppointmentDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{appointment.user.name}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-primary">{appointment.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    `}>
                      {appointment.status === 'confirmed' ? 'Confirmé' : appointment.status === 'pending' ? 'En attente' : 'Annulé'}
                    </span>
                    <DropdownMenu
                      items={[
                        {
                          label: 'Modifier',
                          onClick: () => handleEdit(appointment)
                        },
                        {
                          label: 'Annuler le rendez-vous',
                          onClick: () => handleCancel(appointment.id),
                          destructive: true
                        },
                        {
                          label: 'Supprimer',
                          onClick: () => handleDelete(appointment.id),
                          destructive: true
                        }
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="Aucun rendez-vous"
          description="Il n'y a actuellement aucun rendez-vous dans le système. Vous pouvez créer un nouveau rendez-vous en cliquant sur le bouton ci-dessous."
          actionLabel="Nouveau rendez-vous"
          onAction={() => {
            setEditingAppointment(null);
            setIsFormOpen(true);
          }}
        />
      )}

      <AdminAppointmentForm 
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAppointment(null);
        }}
        appointment={editingAppointment}
      />
    </div>
  );
}
