/*
  # Fix Email Service Integration

  1. Changes
    - Remove HTTP extension usage that's causing errors
    - Simplify the email notification system to use pg_notify
    - Fix the appointment confirmation email trigger
*/

-- Drop the problematic function that uses HTTP extension
DROP FUNCTION IF EXISTS send_email_via_nodemailer;

-- Simplify the email notification function to use pg_notify
CREATE OR REPLACE FUNCTION send_appointment_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  appointment_info RECORD;
  email_payload JSONB;
BEGIN
  -- Récupérer les informations complètes du rendez-vous
  SELECT 
    a.id,
    a.appointment_date,
    a.status,
    a.notes,
    a.location,
    t.name AS treatment_name,
    t.duration AS treatment_duration,
    t.price AS treatment_price,
    u.email AS user_email,
    u.raw_user_meta_data->>'first_name' AS user_first_name,
    u.raw_user_meta_data->>'last_name' AS user_last_name
  INTO appointment_info
  FROM appointments a
  JOIN treatments t ON a.treatment_id = t.id
  JOIN auth.users u ON a.user_id = u.id
  WHERE a.id = NEW.id;

  -- Ne rien faire si le statut n'est pas 'confirmed'
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Créer un payload JSON avec toutes les informations nécessaires
  email_payload := jsonb_build_object(
    'to', appointment_info.user_email,
    'subject', 'Confirmation de votre rendez-vous chez PlasmaCare',
    'appointment', jsonb_build_object(
      'id', appointment_info.id,
      'date', to_char(appointment_info.appointment_date, 'DD/MM/YYYY'),
      'time', to_char(appointment_info.appointment_date, 'HH24:MI'),
      'treatment_name', appointment_info.treatment_name,
      'treatment_duration', appointment_info.treatment_duration,
      'treatment_price', appointment_info.treatment_price,
      'location', COALESCE(appointment_info.location, 'Cabinet Principal'),
      'notes', appointment_info.notes,
      'user_first_name', appointment_info.user_first_name,
      'user_last_name', appointment_info.user_last_name,
      'user_email', appointment_info.user_email
    )
  );

  -- Utiliser pg_notify pour envoyer l'email de manière asynchrone
  -- Le service d'email Node.js écoutera ce canal
  PERFORM pg_notify('appointment_confirmation', email_payload::text);

  -- Log l'envoi d'email dans la console
  RAISE NOTICE 'Email notification sent for appointment %: %', 
    appointment_info.id, 
    email_payload;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le déclencheur pour envoyer l'email lorsqu'un rendez-vous est confirmé
DROP TRIGGER IF EXISTS appointment_confirmation_email_trigger ON appointments;
CREATE TRIGGER appointment_confirmation_email_trigger
AFTER UPDATE OF status ON appointments
FOR EACH ROW
WHEN (OLD.status != 'confirmed' AND NEW.status = 'confirmed')
EXECUTE FUNCTION send_appointment_confirmation_email();