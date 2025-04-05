import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Plus, Edit, Trash2, X, Check, Clock, Mail, Eye } from 'lucide-react';
import { appointments, treatments } from '../../lib/api';
import { cn } from '../../lib/utils';
import { admin } from '../../lib/api';
import { EmailPreview } from '../../components/EmailPreview';

interface Appointment {
  id: string;
  user_id: string;
  treatment_id: string;
  appointment_date: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  treatment_name?: string;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface Treatment {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

interface FormData {
  userId: string;
  treatmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export function AppointmentsList() {
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [treatmentsList, setTreatmentsList] = useState<Treatment[]>([]);
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    treatmentId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    status: 'pending'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [previewAppointment, setPreviewAppointment] = useState<Appointment | null>(null);
  const [emailServiceStatus, setEmailServiceStatus] = useState<'active' | 'inactive'>('inactive');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
    loadUsers();
    loadTreatments();
    checkEmailService();
    
    // Vérifier périodiquement le statut du service d'email
    const intervalId = setInterval(checkEmailService, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  const checkEmailService = async () => {
    try {
      const response = await fetch('http://localhost:3003/health');
      if (response.ok) {
        setEmailServiceStatus('active');
      } else {
        setEmailServiceStatus('inactive');
      }
    } catch (error) {
      setEmailServiceStatus('inactive');
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointments.getAllAsAdmin();
      setAppointmentsList(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await admin.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  };

  const loadTreatments = async () => {
    try {
      const data = await treatments.getAll();
      setTreatmentsList(data);
    } catch (err: any) {
      console.error('Error loading treatments:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Combine date and time
      const dateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      
      const newAppointment = await appointments.createForUser({
        user_id: formData.userId,
        treatment_id: formData.treatmentId,
        appointment_date: dateTime.toISOString(),
        notes: formData.notes,
        status: formData.status
      });

      // Envoyer l'email selon le statut
      if (emailServiceStatus === 'active' && newAppointment) {
        try {
          // Déterminer le type d'email selon le statut
          const emailType = formData.status === 'confirmed' 
            ? 'appointmentConfirmed'
            : formData.status === 'cancelled'
            ? 'appointmentCancelled'
            : 'appointmentCreated';

          await fetch('http://localhost:3003/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appointmentId: newAppointment.id,
              type: emailType
            })
          });
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email:', emailError);
          // On continue même si l'email échoue
        }
      }

      setShowForm(false);
      loadAppointments();
      setSuccessMessage('Le rendez-vous a été créé avec succès');
      setTimeout(() => setSuccessMessage(null), 5000);
      setFormData({
        userId: '',
        treatmentId: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: '',
        status: 'pending'
      });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la création du rendez-vous');
      console.error('Error creating appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      await appointments.update(id, { status });
      
      // Si le statut est confirmé, afficher un message de confirmation d'envoi d'email
      if (status === 'confirmed') {
        // Trouver les informations du rendez-vous pour le message
        const appointment = appointmentsList.find(a => a.id === id);
        if (appointment?.user_email) {
          setEmailSent(`Un email de confirmation a été envoyé à ${appointment.user_email}`);
          
          // Masquer le message après 5 secondes
          setTimeout(() => {
            setEmailSent(null);
          }, 5000);
        }
      }
      
      loadAppointments();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du statut');
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      const { error } = await appointments.update(appointmentId, { status: 'confirmed' });

      if (error) throw error;

      // Envoyer l'email de confirmation
      await fetch('http://localhost:3003/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          type: 'appointmentConfirmed'
        })
      });

      await loadAppointments();
      setSuccessMessage('Rendez-vous confirmé avec succès');
    } catch (err: any) {
      console.error('Erreur lors de la confirmation du rendez-vous:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      const { error } = await appointments.update(appointmentId, { status: 'cancelled' });

      if (error) throw error;

      // Envoyer l'email d'annulation
      await fetch('http://localhost:3003/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          type: 'appointmentCancelled'
        })
      });

      await loadAppointments();
      setSuccessMessage('Rendez-vous annulé avec succès');
    } catch (err: any) {
      console.error('Erreur lors de l\'annulation du rendez-vous:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      
      // D'abord envoyer l'email d'annulation
      await fetch('http://localhost:3003/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          type: 'appointmentCancelled'
        })
      });

      // Puis supprimer le rendez-vous
      const { error } = await appointments.delete(appointmentId);

      if (error) throw error;

      await loadAppointments();
      setSuccessMessage('Rendez-vous supprimé avec succès');
    } catch (err: any) {
      console.error('Erreur lors de la suppression du rendez-vous:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        setLoading(true);
        await handleDeleteAppointment(id);
        setSuccessMessage('Rendez-vous supprimé avec succès');
      } catch (err: any) {
        console.error('Erreur lors de la suppression:', err);
        setError(err.message || 'Une erreur est survenue lors de la suppression');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePreviewEmail = async (id: string) => {
    try {
      const appointment = appointmentsList.find(a => a.id === id);
      if (appointment) {
        setPreviewAppointment(appointment);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la prévisualisation de l\'email');
    }
  };

  const sendTestEmail = async () => {
    try {
      const response = await fetch('http://localhost:3001/test-appointment-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setEmailSent(`Email de test envoyé avec succès à junelamelon92@gmail.com. Vérifiez votre boîte Mailtrap.`);
        setTimeout(() => setEmailSent(null), 5000);
      } else {
        setError(`Erreur lors de l'envoi de l'email de test: ${result.message}`);
      }
    } catch (err: any) {
      setError(`Erreur lors de l'envoi de l'email de test: ${err.message}`);
    }
  };

  const filteredAppointments = appointmentsList.filter((appointment) => {
    if (!searchTerm) return true;
    
    const clientName = `${appointment.user_first_name || ''} ${appointment.user_last_name || ''}`.toLowerCase();
    const email = (appointment.user_email || '').toLowerCase();
    const treatment = (appointment.treatment_name || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return clientName.includes(searchLower) || 
           email.includes(searchLower) || 
           treatment.includes(searchLower);
  });

  if (loading && appointmentsList.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Rendez-vous</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
          </div>
          
          <button className="btn-outline flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtrer
          </button>
          
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4" />
            Nouveau rendez-vous
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadAppointments}
            className="mt-2 text-sm font-medium hover:text-red-800"
          >
            Réessayer
          </button>
        </div>
      )}

      {emailSent && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            <p className="font-medium">{emailSent}</p>
          </div>
          <button 
            onClick={() => setEmailSent(null)}
            className="text-green-500 hover:text-green-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <Check className="w-5 h-5 mr-2" />
            <p className="font-medium">{successMessage}</p>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-green-500 hover:text-green-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Statut du service d'email */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Gestion des Rendez-vous</h1>
        {emailServiceStatus === 'inactive' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Le service d'envoi d'emails n'est pas actif. Les emails ne seront pas envoyés.
                  Veuillez démarrer le service avec la commande : <code className="bg-yellow-100 px-1 py-0.5 rounded">node server/email-service.js</code>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Nouveau rendez-vous</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {users.map((user: User) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traitement
                </label>
                <select
                  name="treatmentId"
                  value={formData.treatmentId}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Sélectionner un traitement</option>
                  {treatmentsList.map((treatment: Treatment) => (
                    <option key={treatment.id} value={treatment.id}>
                      {treatment.name} ({treatment.duration} min - {treatment.price}€)
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
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure
                </label>
                <input
                  type="time"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input h-24"
                  placeholder="Informations complémentaires..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-outline"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Chargement...' : 'Créer le rendez-vous'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Traitement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment: Appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.user_first_name} {appointment.user_last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(appointment.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.treatment_name || 'Non spécifié'}
                      </div>
                      {appointment.treatment_name && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {treatmentsList.find(t => t.id === appointment.treatment_id)?.duration} min
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {appointment.treatment_name ? treatmentsList.find(t => t.id === appointment.treatment_id)?.price : '-'} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      )}>
                        {appointment.status === 'confirmed' 
                          ? 'Confirmé' 
                          : appointment.status === 'cancelled'
                          ? 'Annulé'
                          : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {appointment.status !== 'confirmed' && (
                          <button 
                            onClick={() => handleConfirmAppointment(appointment.id)}
                            className="p-1 hover:bg-green-100 rounded text-green-600"
                            title="Confirmer et envoyer un email"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {appointment.status !== 'cancelled' && (
                          <button 
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handlePreviewEmail(appointment.id)}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Prévisualiser l'email"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(appointment.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'Aucun rendez-vous trouvé' : 'Aucun rendez-vous'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prévisualisation de l'email */}
      {previewAppointment && (
        <EmailPreview 
          appointment={previewAppointment} 
          onClose={() => setPreviewAppointment(null)} 
        />
      )}
    </div>
  );
}