/*
  # Ajout des fonctionnalités d'administration

  1. Nouvelles Tables
    - `programs` : Programmes de traitement personnalisés
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers auth.users)
      - `title` (text)
      - `description` (text)
      - `treatments` (text[])
      - `duration_weeks` (integer)
      - `created_by` (uuid, référence vers auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Vues
    - `users_view` : Vue pour l'administration des utilisateurs
      - Combine les données utilisateur avec leurs métadonnées

  3. Sécurité
    - Activation RLS sur la table programs
    - Politiques pour l'accès administrateur
    - Politiques pour l'accès utilisateur
*/

-- Vue pour l'administration des utilisateurs
CREATE OR REPLACE VIEW users_view AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.updated_at,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name,
  au.raw_user_meta_data->>'role' as role
FROM auth.users au;

-- Table des programmes personnalisés
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  treatments text[] NOT NULL DEFAULT '{}',
  duration_weeks integer NOT NULL DEFAULT 4,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Politiques pour programs
CREATE POLICY "Les administrateurs peuvent tout faire"
  ON programs
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Les utilisateurs peuvent voir leurs programmes"
  ON programs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour le timestamp
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_programs_user_id ON programs(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_by ON programs(created_by);