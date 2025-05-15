'use client'

import { Calendar, Clock, RefreshCw, Check, Clock4, X, Plus } from 'lucide-react';
import Script from 'next/script';
import { useAppointments } from '../../../hooks/useAppointments';
import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Appointments() {
  const { appointments, isLoading, error, updateAppointmentStatus } = useAppointments();
  const [isCalendlyLoaded, setIsCalendlyLoaded] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (window.Calendly && showCalendly) {
      setIsCalendlyLoaded(true);
      initCalendly();
    }
  }, [showCalendly]);

  const initCalendly = () => {
    if (window.Calendly) {
      const container = document.querySelector('.calendly-container');
      if (container) {
        container.innerHTML = '';
      }
      
      window.Calendly.initInlineWidget({
        url: 'https://calendly.com/sidiamadouadnane4?hide_landing_page_details=1&hide_gdpr_banner=1&primary_color=f6a667',
        parentElement: container,
        prefill: {},
        utm: {}
      });
    }
  };

  const handleCalendlyLoad = () => {
    setIsCalendlyLoaded(true);
    if (showCalendly) {
      initCalendly();
    }
  };

  const reloadCalendly = () => {
    initCalendly();
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await updateAppointmentStatus(id, newStatus);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    } finally {
      setUpdatingId(null);
    }
  };

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

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes rendez-vous</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Prendre un rendez-vous</h2>
            {showCalendly && isCalendlyLoaded && (
              <button
                onClick={reloadCalendly}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className="w-4 h-4" />
                Recharger le calendrier
              </button>
            )}
          </div>
        </div>
        
        {!showCalendly ? (
          <div className="p-16 flex flex-col items-center justify-center bg-gray-50">
            <button
              onClick={() => setShowCalendly(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ouvrir le calendrier
            </button>
            <p className="mt-4 text-sm text-gray-600">
              Cliquez pour afficher le calendrier de prise de rendez-vous
            </p>
          </div>
        ) : (
          <div className="relative w-full" style={{ height: '700px' }}>
            <div className="calendly-container absolute inset-0" />
            {!isCalendlyLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-600">Chargement du calendrier...</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {showCalendly && (
          <Script
            src="https://assets.calendly.com/assets/external/widget.js"
            strategy="lazyOnload"
            async
            onLoad={handleCalendlyLoad}
          />
        )}
      </div>

      {appointments.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold p-6 border-b">Rendez-vous prévus</h2>
          <div className="grid divide-y">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{appointment.date}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{appointment.time}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{appointment.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {translateStatus(appointment.status)}
                    </span>
                    <div className="flex gap-1">
                      {appointment.status !== 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                          disabled={updatingId === appointment.id}
                          className="p-1 text-green-600 hover:bg-green-50 rounded-full"
                          title="Confirmer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {appointment.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'pending')}
                          disabled={updatingId === appointment.id}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded-full"
                          title="Mettre en attente"
                        >
                          <Clock4 className="w-4 h-4" />
                        </button>
                      )}
                      {appointment.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                          disabled={updatingId === appointment.id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-full"
                          title="Annuler"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
          description="Vous n'avez pas encore de rendez-vous prévu. Cliquez sur le bouton ci-dessous pour ouvrir le calendrier et prendre un rendez-vous."
          actionLabel="Prendre un rendez-vous"
          onAction={() => setShowCalendly(true)}
        />
      )}
    </div>
  );
}
