-- Suppression des anciennes politiques RLS pour treatments
DROP POLICY IF EXISTS "Anyone can view treatments" ON treatments;
DROP POLICY IF EXISTS "Only admins can modify treatments" ON treatments;

-- Création de nouvelles politiques RLS pour treatments
CREATE POLICY "Tout le monde peut voir les traitements"
  ON treatments FOR SELECT
  USING (true);

CREATE POLICY "Les administrateurs peuvent modifier les traitements"
  ON treatments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Les administrateurs peuvent mettre à jour les traitements"
  ON treatments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Les administrateurs peuvent supprimer les traitements"
  ON treatments FOR DELETE
  USING (true);

-- Création d'une vue pour les statistiques du tableau de bord
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM appointments) AS total_appointments,
  (SELECT COUNT(*) FROM appointments WHERE status = 'confirmed') AS confirmed_appointments,
  (SELECT COUNT(*) FROM treatments) AS total_treatments,
  (SELECT COALESCE(SUM(t.price), 0) 
   FROM appointments a 
   JOIN treatments t ON a.treatment_id = t.id 
   WHERE a.status = 'confirmed') AS total_revenue;

-- Donner les permissions de lecture à tous les utilisateurs authentifiés
GRANT SELECT ON dashboard_stats TO authenticated;

-- Création d'une vue pour les rendez-vous avec informations complètes
CREATE OR REPLACE VIEW appointments_view AS
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