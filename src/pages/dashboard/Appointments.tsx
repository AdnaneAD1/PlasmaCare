import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { CalendlyWidget } from '../../components/appointments/CalendlyWidget';

interface Treatment {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  treatment_id: string;
  treatment: Treatment;
}

const AVAILABLE_TIMES = [
  '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
];

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchTreatments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer d'abord les rendez-vous
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, appointment_date, status, treatment_id')
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Récupérer tous les traitements nécessaires
      const treatmentIds = [...new Set((appointments || []).map(app => app.treatment_id))];
      const { data: treatments, error: treatmentsError } = await supabase
        .from('treatments')
        .select('id, name, duration, price')
        .in('id', treatmentIds);

      if (treatmentsError) throw treatmentsError;

      // Créer un map des traitements pour un accès rapide
      const treatmentMap = new Map(treatments?.map(t => [t.id, t]) || []);

      // Enrichir les rendez-vous avec leurs traitements
      const enrichedAppointments = (appointments || []).map(appointment => ({
        ...appointment,
        treatment: treatmentMap.get(appointment.treatment_id)
      }));

      setAppointments(enrichedAppointments);

    } catch (err) {
      console.error('Erreur lors de la récupération des rendez-vous:', err);
      setError('Impossible de charger vos rendez-vous. Veuillez réessayer plus tard.');
    }
  };

  const fetchTreatments = async () => {
    try {
      const { data, error: treatmentsError } = await supabase
        .from('treatments')
        .select('id, name, duration, price')
        .order('name');

      if (treatmentsError) throw treatmentsError;
      setTreatments(data || []);

    } catch (err) {
      console.error('Erreur lors de la récupération des traitements:', err);
      setError('Impossible de charger les traitements. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Créer la date du rendez-vous
      const appointmentDate = new Date(`${selectedDate}T${selectedTime}`);

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          treatment_id: selectedTreatment,
          appointment_date: appointmentDate.toISOString(),
          status: 'pending'
        });

      if (appointmentError) throw appointmentError;

      // Rafraîchir la liste des rendez-vous
      await fetchAppointments();
      setShowForm(false);
      setSelectedDate('');
      setSelectedTime('');
      setSelectedTreatment('');

    } catch (err) {
      console.error('Erreur lors de la création du rendez-vous:', err);
      setError('Impossible de créer le rendez-vous. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error: cancelError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (cancelError) throw cancelError;
      await fetchAppointments();

    } catch (err) {
      console.error('Erreur lors de l\'annulation du rendez-vous:', err);
      setError('Impossible d\'annuler le rendez-vous. Veuillez réessayer plus tard.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Mes Rendez-vous</h1>
        <div className="flex flex-col md:flex-row gap-2">
          <button 
            className="btn-primary flex items-center justify-center"
            onClick={() => {
              setShowCalendly(true);
              setShowForm(false);
            }}
          >
            <Video className="w-5 h-5 mr-2" />
            Consultation vidéo
          </button>
          <button 
            className="btn-primary flex items-center justify-center"
            onClick={() => {
              setShowForm(true);
              setShowCalendly(false);
            }}
          >
            <Calendar className="w-5 h-5 mr-2" />
            Rendez-vous en cabinet
          </button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {showCalendly ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Consultation vidéo</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowCalendly(false)}
            >
              Fermer
            </button>
          </div>
          <CalendlyWidget url="https://calendly.com/sidiamadoua" />
        </div>
      ) : showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Rendez-vous en cabinet</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowForm(false)}
            >
              Fermer
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Traitement
              </label>
              <select
                value={selectedTreatment}
                onChange={(e) => setSelectedTreatment(e.target.value)}
                className="input"
                required
              >
                <option value="">Sélectionnez un traitement</option>
                {treatments.map((treatment) => (
                  <option key={treatment.id} value={treatment.id}>
                    {treatment.name} ({treatment.duration} min) - {treatment.price}€
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="input"
                required
              >
                <option value="">Sélectionnez une heure</option>
                {AVAILABLE_TIMES.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? <LoadingSpinner /> : 'Confirmer le rendez-vous'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Rendez-vous programmés</h2>
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white p-4 rounded-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}
                    <Clock className="w-4 h-4 ml-4 mr-2" />
                    {new Date(appointment.appointment_date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="font-medium">
                    {appointment.treatment?.name}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm",
                    appointment.status === 'confirmed' && "bg-green-100 text-green-700",
                    appointment.status === 'pending' && "bg-yellow-100 text-yellow-700",
                    appointment.status === 'cancelled' && "bg-red-100 text-red-700"
                  )}>
                    {appointment.status === 'confirmed' ? 'Confirmé' :
                     appointment.status === 'pending' ? 'En attente' : 'Annulé'}
                  </span>
                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">
            Aucun rendez-vous programmé
          </p>
        )}
      </div>
    </div>
  );
}