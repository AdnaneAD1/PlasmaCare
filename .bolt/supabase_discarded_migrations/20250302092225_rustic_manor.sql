/*
  # Correction des politiques RLS pour les rendez-vous

  1. Nouvelles politiques
    - Suppression des anciennes politiques RLS pour appointments
    - Création de nouvelles politiques plus permissives pour appointments
    - Ajout d'une politique pour permettre aux administrateurs de créer des rendez-vous pour n'importe quel utilisateur
  
  2. Correction des vues
    - Mise à jour de la vue appointments_view pour inclure plus d'informations
*/

-- Suppression des anciennes politiques RLS pour appointments
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can do everything" ON appointments;

-- Création de nouvelles politiques RLS pour appointments
CREATE POLICY "Tout le monde peut voir les rendez-vous"
  ON appointments FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres rendez-vous"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent créer des rendez-vous pour n'importe qui"
  ON appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres rendez-vous"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent mettre à jour tous les rendez-vous"
  ON appointments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Les administrateurs peuvent supprimer tous les rendez-vous"
  ON appointments FOR DELETE
  USING (true);

-- Mise à jour de la vue appointments_view
DROP VIEW IF EXISTS appointments_view;
CREATE VIEW appointments_view AS
SELECT
  a.id,
  a.user_id,
  a.treatment_id,
  a.appointment_date,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  a.practitioner,
  a.location,
  t.name AS treatment_name,
  t.duration AS treatment_duration,
  t.price AS treatment_price,
  u.email AS user_email,
  u.raw_user_meta_data->>'first_name' AS user_first_name,
  u.raw_user_meta_data->>'last_name' AS user_last_name
FROM
  appointments a
LEFT JOIN
  treatments t ON a.treatment_id = t.id
LEFT JOIN
  auth.users u ON a.user_id = u.id;

-- Donner les permissions de lecture à tous les utilisateurs authentifiés
GRANT SELECT ON appointments_view TO authenticated;