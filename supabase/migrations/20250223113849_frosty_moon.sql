/*
  # Création de la table admin et mise à jour de la gestion des rôles

  1. Nouvelles Tables
    - `admins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence vers auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table `admins`
    - Ajout de politiques pour la gestion des admins
*/

-- Création de la table admins
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Activer RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Les admins peuvent tout voir"
  ON admins FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ));

CREATE POLICY "Seuls les admins peuvent modifier"
  ON admins
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ));

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_timestamp
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();

-- Insérer l'admin par défaut
INSERT INTO admins (user_id)
VALUES ('5a19ac45-e0c9-4ebe-a54d-d2b4c8e17175')
ON CONFLICT (user_id) DO NOTHING;