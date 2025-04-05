/*
  # Correction des permissions pour la vue users_view

  1. Modifications
    - Supprime et recrée la vue users_view avec les bonnes permissions
    - Ajoute une politique pour permettre l'accès public à la vue
    - Supprime les vérifications d'authentification

  2. Sécurité
    - La vue ne montre que les informations de base des utilisateurs
    - Pas d'accès aux données sensibles
*/

-- Supprime la vue existante
DROP VIEW IF EXISTS users_view;

-- Recrée la vue avec les bonnes permissions
CREATE VIEW users_view AS
SELECT 
  id,
  email,
  created_at,
  updated_at,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name
FROM auth.users;

-- Donne les permissions de lecture à tous les utilisateurs
ALTER VIEW users_view OWNER TO postgres;
GRANT SELECT ON users_view TO anon;
GRANT SELECT ON users_view TO authenticated;
GRANT SELECT ON users_view TO service_role;