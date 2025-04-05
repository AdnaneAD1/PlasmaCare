/*
  # Ajout des tables pour la gestion des produits et des rappels

  1. Nouvelles Tables
    - `products` : Produits associés aux traitements
    - `treatment_products` : Association traitement-produits
    - `product_reminders` : Rappels pour la prise des produits

  2. Sécurité
    - Enable RLS sur les nouvelles tables
    - Politiques pour l'accès administrateur et utilisateur
*/

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  usage_instructions text,
  frequency_per_day integer NOT NULL DEFAULT 3,
  duration_days integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table d'association traitement-produits
CREATE TABLE IF NOT EXISTS treatment_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id uuid REFERENCES treatments(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(treatment_id, product_id)
);

-- Table des rappels de produits
CREATE TABLE IF NOT EXISTS product_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  appointment_id uuid REFERENCES appointments(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  reminder_time time NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reminders ENABLE ROW LEVEL SECURITY;

-- Politiques pour products
CREATE POLICY "Tout le monde peut voir les produits"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Les administrateurs peuvent modifier les produits"
  ON products FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Politiques pour treatment_products
CREATE POLICY "Tout le monde peut voir les associations traitement-produits"
  ON treatment_products FOR SELECT
  USING (true);

CREATE POLICY "Les administrateurs peuvent modifier les associations"
  ON treatment_products FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Politiques pour product_reminders
CREATE POLICY "Les utilisateurs peuvent voir leurs rappels"
  ON product_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour créer les rappels de produits après confirmation d'un rendez-vous
CREATE OR REPLACE FUNCTION create_product_reminders()
RETURNS TRIGGER AS $$
DECLARE
  product_record RECORD;
  reminder_date date;
  reminder_times time[] := ARRAY['08:00:00'::time, '12:00:00'::time, '20:00:00'::time];
BEGIN
  -- Ne rien faire si le statut n'est pas 'confirmed'
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Pour chaque produit associé au traitement
  FOR product_record IN
    SELECT p.*
    FROM treatments t
    JOIN treatment_products tp ON tp.treatment_id = t.id
    JOIN products p ON p.id = tp.product_id
    WHERE t.id = NEW.treatment_id
  LOOP
    -- Calculer la date de fin basée sur la durée du traitement
    reminder_date := NEW.appointment_date::date;
    
    -- Créer un rappel pour chaque horaire
    FOR i IN 1..product_record.frequency_per_day LOOP
      INSERT INTO product_reminders (
        user_id,
        appointment_id,
        product_id,
        reminder_time,
        start_date,
        end_date
      ) VALUES (
        NEW.user_id,
        NEW.id,
        product_record.id,
        reminder_times[i],
        reminder_date,
        reminder_date + (product_record.duration_days || ' days')::interval
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer les rappels lors de la confirmation d'un rendez-vous
CREATE TRIGGER create_product_reminders_trigger
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (OLD.status != 'confirmed' AND NEW.status = 'confirmed')
  EXECUTE FUNCTION create_product_reminders();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_treatment_products_treatment_id ON treatment_products(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_products_product_id ON treatment_products(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reminders_user_id ON product_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reminders_appointment_id ON product_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_product_reminders_dates ON product_reminders(start_date, end_date);