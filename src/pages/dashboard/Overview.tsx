import { useEffect, useState } from 'react';
import { Calendar, Clock, FileText, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { Link } from 'react-router-dom';

interface Stats {
  upcomingAppointments: number;
  totalTreatmentTime: number;
  completedDiagnoses: number;
  treatmentProgress: number;
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  category: string;
}

interface Diagnosis {
  date: string;
  type: string;
  result: string;
}

interface Treatment {
  id: string;
  name: string;
  duration: number;
  category: 'alopecie' | 'blepharochalasis' | 'other';
}

// Fonction pour traduire le statut en français
const translateStatus = (status: string): string => {
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

// Fonction pour traduire la catégorie en français
const translateCategory = (category: string): string => {
  switch (category) {
    case 'alopecie':
      return 'Alopécie';
    case 'blepharochalasis':
      return 'Blépharochalasis';
    default:
      return 'Autre';
  }
};

export function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        // Récupérer tous les rendez-vous de l'utilisateur (passés et futurs)
        const { data: allAppointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, appointment_date, status, treatment_id')
          .eq('user_id', user.id)
          .order('appointment_date', { ascending: true });

        if (appointmentsError) throw appointmentsError;

        // Récupérer tous les traitements disponibles
        const { data: allTreatments, error: treatmentsError } = await supabase
          .from('treatments')
          .select('id, name, duration, category');

        if (treatmentsError) throw treatmentsError;

        // Créer un map des traitements pour un accès rapide
        const treatmentMap = new Map(allTreatments?.map(t => [t.id, t]) || []);

        // Filtrer les rendez-vous à venir pour les stats
        const upcomingAppointments = (allAppointments || [])
          .filter(app => new Date(app.appointment_date) >= new Date())
          .filter(app => app.status === 'confirmed')
          .map(app => ({
            ...app,
            treatment: treatmentMap.get(app.treatment_id)
          }));

        // Calculer le pourcentage de traitements validés
        const completedAppointments = (allAppointments || [])
          .filter(app => app.status === 'confirmed' && new Date(app.appointment_date) < new Date());

        // Créer un Set des IDs de traitements uniques validés
        const completedTreatmentIds = new Set(completedAppointments.map(app => app.treatment_id));
        const totalTreatments = allTreatments?.length || 0;
        const treatmentProgress = totalTreatments > 0 
          ? Math.round((completedTreatmentIds.size / totalTreatments) * 100)
          : 0;

        // Récupérer les diagnostics
        const { data: userDiagnoses, error: diagnosesError } = await supabase
          .from('diagnoses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (diagnosesError) throw diagnosesError;

        const totalTime = upcomingAppointments.reduce((total, appointment) => {
          return total + (appointment.treatment?.duration || 0);
        }, 0);

        // Mettre à jour l'état
        setStats({
          upcomingAppointments: upcomingAppointments.length,
          totalTreatmentTime: totalTime,
          completedDiagnoses: userDiagnoses?.length || 0,
          treatmentProgress
        });

        // Formater les rendez-vous pour l'affichage
        setAppointments(upcomingAppointments.slice(0, 3).map(app => ({
          id: app.id,
          title: app.treatment?.name || 'Rendez-vous',
          date: new Date(app.appointment_date).toLocaleDateString('fr-FR'),
          time: new Date(app.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: app.status,
          category: app.treatment?.category || 'other'
        })));

        // Formater les diagnostics pour l'affichage
        setDiagnoses(userDiagnoses?.slice(0, 2).map(diagnosis => ({
          date: new Date(diagnosis.created_at).toLocaleDateString('fr-FR'),
          type: `Type de peau : ${diagnosis.skin_type}`,
          result: `${diagnosis.concerns?.length || 0} préoccupation(s) identifiée(s)`
        })) || []);

      } catch (err: any) {
        console.error('Erreur lors de la récupération des données:', err);
        setError(err.message || 'Une erreur est survenue lors de la récupération des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Link to="/dashboard/appointments" className="btn-primary w-full md:w-auto">
          Nouveau rendez-vous
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-gray-500">Ce mois</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{stats?.upcomingAppointments || 0}</h3>
          <p className="text-gray-600">Rendez-vous prévus</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{stats?.totalTreatmentTime || 0} min</h3>
          <p className="text-gray-600">Temps de soins</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{stats?.completedDiagnoses || 0}</h3>
          <p className="text-gray-600">Diagnostics réalisés</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-sm font-medium text-gray-500">Progression</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{stats?.treatmentProgress || 0}%</h3>
          <p className="text-gray-600">Objectifs atteints</p>
          {goalsError && (
            <p className="text-sm text-gray-500 mt-2">{goalsError}</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Prochains rendez-vous</h2>
          <div className="space-y-4">
            {appointments.length > 0 ? (
              appointments.map(appointment => (
                <div 
                  key={appointment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium">{appointment.title}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {appointment.date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {appointment.time}
                      </div>
                      <div className="text-sm text-gray-500">
                        {translateCategory(appointment.category)}
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm",
                    appointment.status === 'confirmed' && "bg-green-100 text-green-700",
                    appointment.status === 'pending' && "bg-yellow-100 text-yellow-700",
                    appointment.status === 'cancelled' && "bg-red-100 text-red-700"
                  )}>
                    {translateStatus(appointment.status)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                Aucun rendez-vous prévu
              </p>
            )}
          </div>
        </div>

        {/* Recent Diagnoses */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Derniers diagnostics</h2>
          <div className="space-y-4">
            {diagnoses.length > 0 ? (
              diagnoses.map((diagnosis, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    {diagnosis.date}
                  </div>
                  <h3 className="font-medium mb-1">{diagnosis.type}</h3>
                  <p className="text-sm text-gray-600">{diagnosis.result}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                Aucun diagnostic réalisé
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}