/*
  # Mise à jour du système de rendez-vous

  1. Modifications
    - Ajout du champ practitioner aux rendez-vous
    - Ajout du champ location aux rendez-vous
    - Ajout d'index pour améliorer les performances

  2. Sécurité
    - Mise à jour des politiques RLS pour les nouveaux champs
*/

-- Ajout des nouveaux champs à la table appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS practitioner text,
ADD COLUMN IF NOT EXISTS location text DEFAULT 'Cabinet Principal';

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id_date ON appointments(user_id, appointment_date);

-- Mise à jour des politiques RLS
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;

CREATE POLICY "Users can view their own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour les administrateurs
CREATE POLICY "Admins can do everything"
  ON appointments
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');