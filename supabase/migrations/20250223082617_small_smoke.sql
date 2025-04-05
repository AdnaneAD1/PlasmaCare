/*
  # Création des tables initiales

  1. Nouvelles Tables
    - `diagnoses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `skin_type` (enum)
      - `hair_type` (text)
      - `concerns` (text[])
      - `allergies` (text[])
      - `medical_history` (text)
      - `current_products` (text[])
      - `recommendations` (jsonb)
      - `created_at` (timestamp)

    - `treatments`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `duration` (integer)
      - `price` (numeric)
      - `category` (enum)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `appointments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `treatment_id` (uuid, foreign key)
      - `appointment_date` (timestamp)
      - `status` (enum)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour permettre aux utilisateurs d'accéder à leurs propres données
*/

-- Création des types enum
CREATE TYPE skin_type AS ENUM ('normal', 'sec', 'gras', 'mixte');
CREATE TYPE treatment_category AS ENUM ('alopecie', 'blepharochalasis', 'other');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Table des diagnostics
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  skin_type skin_type NOT NULL,
  hair_type text NOT NULL,
  concerns text[] NOT NULL,
  allergies text[],
  medical_history text,
  current_products text[],
  recommendations jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table des traitements
CREATE TABLE IF NOT EXISTS treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration integer NOT NULL,
  price numeric(10,2) NOT NULL,
  category treatment_category NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des rendez-vous
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  treatment_id uuid REFERENCES treatments(id) NOT NULL,
  appointment_date timestamptz NOT NULL,
  status appointment_status DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politiques pour diagnoses
CREATE POLICY "Users can view their own diagnoses"
  ON diagnoses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagnoses"
  ON diagnoses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politiques pour treatments
CREATE POLICY "Anyone can view treatments"
  ON treatments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify treatments"
  ON treatments FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour appointments
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

-- Insérer les traitements par défaut
INSERT INTO treatments (name, description, duration, price, category) VALUES
  ('Traitement Alopécie', 'Traitement au plasma froid russe pour l''alopécie de traction', 60, 250.00, 'alopecie'),
  ('Soin Blépharochalasis', 'Traitement spécifique pour le blépharochalasis', 45, 200.00, 'blepharochalasis')
ON CONFLICT DO NOTHING;