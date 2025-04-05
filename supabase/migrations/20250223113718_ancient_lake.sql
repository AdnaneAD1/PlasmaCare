/*
  # Ajout de la fonction create_user et mise à jour de l'admin

  1. Modifications
    - Crée la fonction auth.create_user pour gérer la création d'utilisateurs
    - Met à jour l'utilisateur admin existant avec le rôle approprié
*/

-- Création de la fonction create_user si elle n'existe pas
CREATE OR REPLACE FUNCTION auth.create_user(user_data jsonb)
RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    user_data->>'email',
    crypt(user_data->>'password', gen_salt('bf')),
    CASE 
      WHEN (user_data->>'email_confirmed')::boolean THEN now()
      ELSE NULL
    END,
    user_data->'user_metadata',
    now(),
    now()
  )
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mise à jour de l'utilisateur admin existant
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'first_name', 'Admin',
  'last_name', 'PlasmaCare',
  'role', 'admin'
)
WHERE id = '5a19ac45-e0c9-4ebe-a54d-d2b4c8e17175';