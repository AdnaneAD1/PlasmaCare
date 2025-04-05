/*
  # Mise à jour du rôle administrateur

  1. Modifications
    - Met à jour le rôle de l'utilisateur admin existant
    - Assure que l'utilisateur a les bonnes métadonnées
*/

-- Met à jour les métadonnées de l'utilisateur admin existant
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@plasmacare.com'
AND (raw_user_meta_data->>'role' IS NULL OR raw_user_meta_data->>'role' != 'admin');