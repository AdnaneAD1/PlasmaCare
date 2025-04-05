-- Drop existing view if it exists
DROP VIEW IF EXISTS users_view;

-- Create the users view with proper permissions
CREATE OR REPLACE VIEW users_view AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.updated_at,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name,
  au.raw_user_meta_data->>'role' as role,
  EXISTS (
    SELECT 1 FROM admins a WHERE a.user_id = au.id
  ) as is_admin
FROM auth.users au;

-- Grant permissions
GRANT SELECT ON users_view TO authenticated;
GRANT SELECT ON users_view TO service_role;