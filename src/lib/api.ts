import { supabase } from './supabase';

export const auth = {
  login: async (email: string, password: string) => {
    console.log('Attempting login with:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('Login response:', { data, error });

    if (error) {
      console.error('Login error:', error);
      throw new Error(error.message);
    }
    return data;
  },
  
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    console.log('Attempting registration for:', data.email);
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: 'user'
        },
        // emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    console.log('Registration response:', { authData, error });

    if (error) {
      console.error('Registration error:', error);
      throw new Error(error.message);
    }

    // Vérifier si l'email nécessite une confirmation
    // if (authData.user?.identities?.length === 0) {
    //   throw new Error('EMAIL_CONFIRMATION_NEEDED');
    // }

    return authData;
  }
};

export const admin = {
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users_view')
      .select('*')
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getStats() {
    try {
      // Récupérer le nombre total d'utilisateurs (non-admin)
      const { data: users, error: usersError } = await supabase
        .from('users_view')
        .select('id', { count: 'exact' })
        .eq('role', 'user');

      if (usersError) throw usersError;

      // Récupérer les rendez-vous et calculer le chiffre d'affaires
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, status, treatment_id');

      if (appointmentsError) throw appointmentsError;

      // Récupérer tous les traitements pour le calcul du chiffre d'affaires
      const { data: treatments, error: treatmentsError } = await supabase
        .from('treatments')
        .select('id, price');

      if (treatmentsError) throw treatmentsError;

      // Créer un map des prix des traitements
      const treatmentPrices = new Map(
        treatments?.map(t => [t.id, t.price]) || []
      );

      // Calculer le chiffre d'affaires des rendez-vous confirmés
      const totalRevenue = (appointments || [])
        .filter(app => app.status === 'confirmed')
        .reduce((sum, app) => {
          const price = treatmentPrices.get(app.treatment_id) || 0;
          return sum + price;
        }, 0);

      // Récupérer le nombre total de traitements actifs
      const { count: totalTreatments, error: treatmentsCountError } = await supabase
        .from('treatments')
        .select('id', { count: 'exact' });

      if (treatmentsCountError) throw treatmentsCountError;

      return {
        total_users: users?.length || 0,
        total_appointments: appointments?.length || 0,
        total_revenue: totalRevenue,
        total_treatments: totalTreatments || 0
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  async getAllAsAdmin() {
    try {
      // Récupérer tous les rendez-vous
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Récupérer tous les utilisateurs et traitements nécessaires
      const { data: users, error: usersError } = await supabase
        .from('users_view')
        .select('id, first_name, last_name, email');

      if (usersError) throw usersError;

      const { data: treatments, error: treatmentsError } = await supabase
        .from('treatments')
        .select('id, name, duration, price');

      if (treatmentsError) throw treatmentsError;

      // Créer des maps pour un accès rapide
      const userMap = new Map(users?.map(u => [u.id, u]) || []);
      const treatmentMap = new Map(treatments?.map(t => [t.id, t]) || []);

      // Enrichir les rendez-vous avec les données utilisateur et traitement
      const enrichedAppointments = appointments?.map(appointment => {
        const user = userMap.get(appointment.user_id);
        const treatment = treatmentMap.get(appointment.treatment_id);

        return {
          ...appointment,
          user: user ? {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
          } : null,
          treatment: treatment ? {
            id: treatment.id,
            name: treatment.name,
            duration: treatment.duration,
            price: treatment.price
          } : null
        };
      });

      return enrichedAppointments || [];
    } catch (error) {
      console.error('Error fetching admin appointments:', error);
      throw error;
    }
  },

  getUserDetails: async (userId: string) => {
    const [userDetails, diagnoses, appointments, programs] = await Promise.all([
      supabase
        .from('users_view')
        .select('*')
        .eq('id', userId)
        .single(),
      supabase
        .from('diagnoses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('appointment_date', { ascending: true }),
      supabase
        .from('programs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ]);

    if (userDetails.error) throw userDetails.error;
    if (diagnoses.error) throw diagnoses.error;
    if (appointments.error) throw appointments.error;
    if (programs.error) throw programs.error;

    return {
      ...userDetails.data,
      diagnoses: diagnoses.data,
      appointments: appointments.data,
      programs: programs.data
    };
  },

  updateUserRole: async (userId: string, role: 'user' | 'admin') => {
    if (role === 'admin') {
      const { error } = await supabase
        .from('admins')
        .insert({ user_id: userId })
        .select()
        .single();

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    }

    return { success: true };
  },

  createProgram: async (data: {
    user_id: string;
    title: string;
    description: string;
    treatments: string[];
    duration_weeks: number;
  }) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data: program, error } = await supabase
      .from('programs')
      .insert({
        ...data,
        created_by: userData.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return program;
  },

  getPrograms: async (userId: string) => {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

export const diagnosis = {
  create: async (data: {
    skinType: 'normal' | 'sec' | 'gras' | 'mixte';
    hairType: string;
    concerns: string[];
    allergies?: string[];
    medicalHistory?: string;
    currentProducts?: string[];
  }) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data: diagnosisData, error } = await supabase
      .from('diagnoses')
      .insert({
        user_id: userData.user.id,
        skin_type: data.skinType,
        hair_type: data.hairType,
        concerns: data.concerns,
        allergies: data.allergies || [],
        medical_history: data.medicalHistory || '',
        current_products: data.currentProducts || []
      })
      .select()
      .single();

    if (error) throw error;
    return diagnosisData;
  },

  getHistory: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

export const treatments = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  create: async (data: {
    name: string;
    description: string;
    duration: number;
    price: number;
    category: 'alopecie' | 'blepharochalasis' | 'other';
  }) => {
    const { data: treatmentData, error } = await supabase
      .from('treatments')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return treatmentData;
  },

  update: async (id: string, data: Partial<{
    name: string;
    description: string;
    duration: number;
    price: number;
    category: 'alopecie' | 'blepharochalasis' | 'other';
  }>) => {
    const { data: treatmentData, error } = await supabase
      .from('treatments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return treatmentData;
  },

  delete: async (id: string) => {
    try {
      // 1. Récupérer les rendez-vous liés à ce traitement
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('treatment_id', id);

      if (appointmentsError) throw appointmentsError;

      // 2. Si des rendez-vous existent, les supprimer d'abord
      if (appointments && appointments.length > 0) {
        // Pour chaque rendez-vous qui n'est pas annulé, envoyer un email
        for (const appointment of appointments) {
          if (appointment.status !== 'cancelled') {
            try {
              await fetch('http://localhost:3003/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  appointmentId: appointment.id,
                  type: 'appointmentCancelled'
                })
              });
            } catch (emailError) {
              console.error('Erreur lors de l\'envoi de l\'email d\'annulation:', emailError);
              // Continuer même si l'envoi d'email échoue
            }
          }
        }

        // Supprimer tous les rendez-vous liés
        const { error: deleteAppointmentsError } = await supabase
          .from('appointments')
          .delete()
          .eq('treatment_id', id);

        if (deleteAppointmentsError) throw deleteAppointmentsError;
      }

      // 3. Supprimer les objectifs liés au traitement
      // const { error: deleteGoalsError } = await supabase
      //   .from('treatment_goals')
      //   .delete()
      //   .eq('treatment_id', id);

      // if (deleteGoalsError) throw deleteGoalsError;

      // 4. Enfin, supprimer le traitement
      const { error: deleteTreatmentError } = await supabase
        .from('treatments')
        .delete()
        .eq('id', id);

      if (deleteTreatmentError) throw deleteTreatmentError;

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression du traitement:', error);
      throw error;
    }
  },

  getProducts: async (treatmentId: string) => {
    const { data, error } = await supabase
      .from('treatment_products')
      .select(`
        product_id,
        products (
          id,
          name,
          description,
          usage_instructions,
          frequency_per_day,
          duration_days
        )
      `)
      .eq('treatment_id', treatmentId);

    if (error) throw error;
    return data;
  },

  addProducts: async (treatmentId: string, productIds: string[]) => {
    const associations = productIds.map(productId => ({
      treatment_id: treatmentId,
      product_id: productId
    }));

    const { error } = await supabase
      .from('treatment_products')
      .insert(associations);

    if (error) throw error;
  },

  removeProducts: async (treatmentId: string, productIds: string[]) => {
    const { error } = await supabase
      .from('treatment_products')
      .delete()
      .eq('treatment_id', treatmentId)
      .in('product_id', productIds);

    if (error) throw error;
  }
};

export const appointments = {
  getAll: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  getAllAsAdmin: async () => {
    // 1. Récupérer tous les rendez-vous
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true });

    if (appointmentsError) throw appointmentsError;

    // 2. Récupérer tous les utilisateurs concernés
    const userIds = [...new Set(appointments.map(a => a.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('users_view')
      .select('*')
      .in('id', userIds);

    if (usersError) throw usersError;

    // 3. Récupérer tous les traitements concernés
    const treatmentIds = [...new Set(appointments.map(a => a.treatment_id))];
    const { data: treatments, error: treatmentsError } = await supabase
      .from('treatments')
      .select('*')
      .in('id', treatmentIds);

    if (treatmentsError) throw treatmentsError;

    // 4. Créer un map pour un accès rapide aux données
    const usersMap = new Map(users.map(u => [u.id, u]));
    const treatmentsMap = new Map(treatments.map(t => [t.id, t]));

    // 5. Combiner les données
    return appointments.map(appointment => {
      const user = usersMap.get(appointment.user_id);
      const treatment = treatmentsMap.get(appointment.treatment_id);

      return {
        id: appointment.id,
        user_id: appointment.user_id,
        treatment_id: appointment.treatment_id,
        appointment_date: appointment.appointment_date,
        status: appointment.status,
        notes: appointment.notes,
        completed: appointment.completed,
        user_email: user?.email,
        user_first_name: user?.first_name,
        user_last_name: user?.last_name,
        treatment_name: treatment?.name,
        treatment_duration: treatment?.duration,
        treatment_price: treatment?.price,
        created_at: appointment.created_at,
        updated_at: appointment.updated_at
      };
    });
  },

  create: async (data: {
    treatment_id: string;
    appointment_date: string;
    notes?: string;
  }) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data: appointmentData, error } = await supabase
      .from('appointments')
      .insert({
        ...data,
        user_id: userData.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return appointmentData;
  },

  createForUser: async (data: {
    user_id: string;
    treatment_id: string;
    appointment_date: string;
    notes?: string;
    status?: 'pending' | 'confirmed' | 'cancelled';
  }) => {
    const { data: appointmentData, error } = await supabase
      .from('appointments')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return appointmentData;
  },

  update: async (id: string, data: {
    status: 'pending' | 'confirmed' | 'cancelled';
    notes?: string;
  }) => {
    const { data: appointmentData, error } = await supabase
      .from('appointments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return appointmentData;
  },

  delete: async (id: string) => {
    try {
      // 1. Récupérer les informations du rendez-vous
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          treatments (
            name,
            duration,
            price
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 2. Si le rendez-vous existe et n'est pas déjà annulé, envoyer un email
      if (appointment && appointment.status !== 'cancelled') {
        try {
          await fetch('http://localhost:3003/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appointmentId: id,
              type: 'appointmentCancelled'
            })
          });
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email d\'annulation:', emailError);
          // Continuer même si l'envoi d'email échoue
        }
      }

      // 3. Supprimer le rendez-vous
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression du rendez-vous:', error);
      throw error;
    }
  },
  
  // Nouvelle fonction pour prévisualiser l'email de confirmation
  getEmailPreview: async (id: string) => {
    const { data, error } = await supabase
      .from('appointments_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
};

// API pour les produits
export const products = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  create: async (product: {
    name: string;
    description?: string;
    usage_instructions: string;
    frequency_per_day: number;
    duration_days: number;
  }) => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, product: {
    name?: string;
    description?: string;
    usage_instructions?: string;
    frequency_per_day?: number;
    duration_days?: number;
  }) => {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Association avec les traitements
  linkToTreatment: async (productId: string, treatmentId: string) => {
    const { error } = await supabase
      .from('treatment_products')
      .insert([{ product_id: productId, treatment_id: treatmentId }]);

    if (error) throw error;
  },

  unlinkFromTreatment: async (productId: string, treatmentId: string) => {
    const { error } = await supabase
      .from('treatment_products')
      .delete()
      .match({ product_id: productId, treatment_id: treatmentId });

    if (error) throw error;
  }
};

// API pour les notifications
export const notifications = {
  // Récupérer les notifications de l'utilisateur
  getAll: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Marquer une notification comme lue
  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Sauvegarder une souscription push
  savePushSubscription: async (subscription: PushSubscription) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('push_subscriptions')
      .insert([{ 
        user_id: user?.id,
        subscription
      }]);

    if (error) throw error;
  },

  // Supprimer une souscription push
  deletePushSubscription: async (endpoint: string) => {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) throw error;
  },

  // Récupérer les rappels de produits
  getProductReminders: async () => {
    const { data, error } = await supabase
      .from('product_reminders')
      .select(`
        *,
        products (
          name,
          usage_instructions
        )
      `)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('reminder_time', { ascending: true });

    if (error) throw error;
    return data;
  }
};

export default {
  auth,
  admin,
  diagnosis,
  treatments,
  appointments,
  products,
  notifications
};
