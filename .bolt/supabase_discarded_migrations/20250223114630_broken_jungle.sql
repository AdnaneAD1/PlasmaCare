/*
  # Configuration de l'administration

  1. Vue utilisateurs
    - Crée une vue en lecture seule pour les utilisateurs
    - Inclut les informations de base et les métadonnées

  2. Politiques de sécurité
    - Met à jour les politiques RLS pour la table admins
    - Ajoute des index pour les performances

  3. Sécurité
    - Restreint l'accès aux administrateurs uniquement
*/

-- Vue pour l'administration des utilisateurs (sans modification de colonnes)
CREATE OR REPLACE VIEW users_view AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.updated_at,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name
FROM auth.users au;

-- Mise à jour des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);

-- Suppression et recréation des politiques RLS pour la table admins
DROP POLICY IF EXISTS "Les admins peuvent tout voir" ON admins;
DROP POLICY IF EXISTS "Seuls les admins peuvent modifier" ON admins;

-- Nouvelles politiques plus restrictives
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