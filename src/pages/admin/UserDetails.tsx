import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, User, Plus } from 'lucide-react';
import { admin } from '../../lib/api';

export function UserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [programData, setProgramData] = useState({
    title: '',
    description: '',
    treatments: [] as string[],
    duration_weeks: 4
  });

  useEffect(() => {
    if (id) {
      loadUserDetails(id);
    }
  }, [id]);

  const loadUserDetails = async (userId: string) => {
    try {
      setLoading(true);
      const details = await admin.getUserDetails(userId);
      setUser(details);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Error loading user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProgramData(prev => ({
      ...prev,
      [name]: name === 'duration_weeks' ? Number(value) : value
    }));
  };

  const handleTreatmentToggle = (treatment: string) => {
    setProgramData(prev => ({
      ...prev,
      treatments: prev.treatments.includes(treatment)
        ? prev.treatments.filter(t => t !== treatment)
        : [...prev.treatments, treatment]
    }));
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    try {
      setLoading(true);
      await admin.createProgram({
        user_id: id,
        title: programData.title,
        description: programData.description,
        treatments: programData.treatments,
        duration_weeks: programData.duration_weeks
      });
      
      setShowProgramForm(false);
      setProgramData({
        title: '',
        description: '',
        treatments: [],
        duration_weeks: 4
      });
      
      loadUserDetails(id);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la création du programme');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p className="font-medium">Erreur</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => id && loadUserDetails(id)}
          className="mt-2 text-sm font-medium hover:text-red-800"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Utilisateur non trouvé</p>
        <Link to="/admin" className="text-primary hover:text-primary-dark mt-4 inline-block">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Détails de l'utilisateur</h1>
        </div>
        
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowProgramForm(true)}
        >
          <Plus className="w-4 h-4" />
          Créer un programme
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-500">{user.email}</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {user.is_admin ? 'Administrateur' : 'Client'}
              </span>
            </div>
          </div>
        </div>

        {showProgramForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Créer un programme personnalisé</h3>
            <form onSubmit={handleProgramSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du programme
                </label>
                <input
                  type="text"
                  name="title"
                  value={programData.title}
                  onChange={handleProgramInputChange}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={programData.description}
                  onChange={handleProgramInputChange}
                  className="input h-24"
                  placeholder="Description du programme..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traitements recommandés
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Traitement Alopécie', 'Soin Blépharochalasis', 'Massage Capillaire', 'Soin Hydratant'].map((treatment) => (
                    <label
                      key={treatment}
                      className={`
                        relative flex items-center p-3 rounded-lg border-2 cursor-pointer
                        ${programData.treatments.includes(treatment) ? 'border-primary bg-primary/5' : 'border-gray-200'}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={programData.treatments.includes(treatment)}
                        onChange={() => handleTreatmentToggle(treatment)}
                        className="sr-only"
                      />
                      <span className="text-sm">{treatment}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (semaines)
                </label>
                <input
                  type="number"
                  name="duration_weeks"
                  value={programData.duration_weeks}
                  onChange={handleProgramInputChange}
                  className="input"
                  min="1"
                  max="52"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProgramForm(false)}
                  className="btn-outline"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Chargement...' : 'Créer le programme'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Diagnostics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Diagnostics</h3>
            </div>
            <div className="space-y-3">
              {user.diagnoses?.length > 0 ? (
                user.diagnoses.map((diagnosis: any) => (
                  <div key={diagnosis.id} className="bg-white rounded-lg p-3">
                    <div className="text-sm font-medium">Type de peau: {diagnosis.skin_type}</div>
                    <div className="text-sm">Type de cheveux: {diagnosis.hair_type}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(diagnosis.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucun diagnostic</p>
              )}
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Rendez-vous</h3>
            </div>
            <div className="space-y-3">
              {user.appointments?.length > 0 ? (
                user.appointments.map((appointment: any) => (
                  <div key={appointment.id} className="bg-white rounded-lg p-3">
                    <div className="text-sm font-medium">
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm">Status: {appointment.status}</div>
                    {appointment.notes && (
                      <div className="text-xs text-gray-500 mt-1">{appointment.notes}</div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucun rendez-vous</p>
              )}
            </div>
          </div>

          {/* Programs */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Programmes</h3>
            </div>
            <div className="space-y-3">
              {user.programs?.length > 0 ? (
                user.programs.map((program: any) => (
                  <div key={program.id} className="bg-white rounded-lg p-3">
                    <div className="text-sm font-medium">{program.title}</div>
                    <div className="text-sm">{program.duration_weeks} semaines</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(program.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucun programme</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}