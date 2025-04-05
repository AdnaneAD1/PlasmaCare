/*
  # Mise à jour de l'utilisateur admin

  1. Modifications
    - Met à jour les métadonnées de l'utilisateur admin existant avec l'ID spécifique
    - Ajoute le rôle admin aux métadonnées
*/

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE id = '5a19ac45-e0c9-4ebe-a54d-d2b4c8e17175';