/*
  # Create Admin User

  1. Changes
    - Creates a function to safely generate admin credentials
    - Adds an admin user with encrypted password
    - Sets up proper metadata and role

  2. Security
    - Uses secure password hashing
    - Sets email as confirmed
    - Assigns admin role through metadata
*/

-- Création de la fonction pour générer un UUID stable pour l'admin
CREATE OR REPLACE FUNCTION get_admin_uuid()
RETURNS uuid AS $$
BEGIN
  -- Utilise un UUID déterministe basé sur un namespace
  RETURN uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8', -- UUID namespace
    'admin@plasmacare.com'                    -- Email comme clé unique
  );
END;
$$ LANGUAGE plpgsql;

-- Insertion de l'administrateur
DO $$
DECLARE
  admin_exists boolean;
  admin_id uuid;
BEGIN
  -- Vérifie si l'admin existe déjà
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@plasmacare.com'
  ) INTO admin_exists;

  IF NOT admin_exists THEN
    -- Génère l'UUID admin
    admin_id := get_admin_uuid();
    
    -- Insère l'utilisateur admin
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token
    )
    VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@plasmacare.com',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin", "first_name": "Admin", "last_name": "PlasmaCare"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex')
    );
  END IF;
END $$;