/*
  # Intégration de Mailtrap pour l'envoi d'emails

  1. Nouvelle Fonction
    - Création d'une fonction pour envoyer des emails via l'API Mailtrap
    - Configuration des paramètres d'authentification Mailtrap
    - Mise en place du format d'email HTML pour les confirmations de rendez-vous
  
  2. Modifications
    - Mise à jour du trigger existant pour utiliser la nouvelle fonction d'envoi d'email
    - Ajout de logs pour le suivi des envois d'emails
*/

-- Fonction pour envoyer un email via l'API Mailtrap
CREATE OR REPLACE FUNCTION send_email_via_mailtrap(
  to_email TEXT,
  subject TEXT,
  html_content TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  mailtrap_api_key TEXT := 'e3f9361c71e91d5b9b9b1eae353671d5';
  mailtrap_host TEXT := 'sandbox.api.mailtrap.io';
  mailtrap_endpoint TEXT := 'https://sandbox.api.mailtrap.io/api/send';
  response JSONB;
  http_response_code INT;
BEGIN
  -- Appel à l'API Mailtrap via la fonction http_post de Supabase
  SELECT
    status,
    content::jsonb
  INTO
    http_response_code,
    response
  FROM
    http((
      'POST',
      mailtrap_endpoint,
      ARRAY[
        ('Content-Type', 'application/json'),
        ('Api-Token', mailtrap_api_key)
      ],
      '{
        "to": [{"email": "' || to_email || '"}],
        "from": {"email": "contact@plasmacare.com", "name": "PlasmaCare"},
        "subject": "' || subject || '",
        "html": "' || html_content || '",
        "category": "appointment_confirmation"
      }'
    ));

  -- Log la réponse pour le débogage
  RAISE NOTICE 'Mailtrap API response: % (status: %)', response, http_response_code;

  -- Vérifier si l'envoi a réussi (code 200 ou 201)
  IF http_response_code BETWEEN 200 AND 201 THEN
    RETURN TRUE;
  ELSE
    RAISE WARNING 'Failed to send email via Mailtrap: %', response;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction mise à jour pour envoyer un email de confirmation de rendez-vous via Mailtrap
CREATE OR REPLACE FUNCTION send_appointment_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  appointment_info RECORD;
  email_subject TEXT;
  email_content TEXT;
  email_sent BOOLEAN;
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

  -- Préparer le sujet et le contenu de l'email
  email_subject := 'Confirmation de votre rendez-vous chez PlasmaCare';
  
  -- Contenu HTML de l'email
  email_content := '
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #b97A56;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 20px;
        background-color: #f9f9f9;
      }
      .appointment-details {
        background-color: white;
        border-radius: 5px;
        padding: 15px;
        margin: 20px 0;
        border-left: 4px solid #b97A56;
      }
      .footer {
        text-align: center;
        padding: 20px;
        font-size: 12px;
        color: #666;
      }
      .button {
        display: inline-block;
        background-color: #b97A56;
        color: white;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 5px;
        margin-top: 15px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>PlasmaCare</h1>
      <p>Votre rendez-vous est confirmé</p>
    </div>
    <div class="content">
      <p>Bonjour ' || appointment_info.user_first_name || ' ' || appointment_info.user_last_name || ',</p>
      
      <p>Nous avons le plaisir de vous confirmer votre rendez-vous chez PlasmaCare.</p>
      
      <div class="appointment-details">
        <h3>Détails du rendez-vous :</h3>
        <p><strong>Date :</strong> ' || to_char(appointment_info.appointment_date, 'DD/MM/YYYY') || '</p>
        <p><strong>Heure :</strong> ' || to_char(appointment_info.appointment_date, 'HH24:MI') || '</p>
        <p><strong>Traitement :</strong> ' || appointment_info.treatment_name || '</p>
        <p><strong>Durée :</strong> ' || appointment_info.treatment_duration || ' minutes</p>
        <p><strong>Prix :</strong> ' || appointment_info.treatment_price || ' €</p>
        <p><strong>Lieu :</strong> ' || COALESCE(appointment_info.location, 'Cabinet Principal') || '</p>
      </div>
      
      <p>Si vous avez des questions ou si vous souhaitez modifier votre rendez-vous, n''hésitez pas à nous contacter par téléphone au 01 23 45 67 89 ou par email à contact@plasmacare.com.</p>
      
      <p>Nous vous remercions de votre confiance et nous nous réjouissons de vous accueillir prochainement.</p>
      
      <p>Cordialement,<br>L''équipe PlasmaCare</p>
      
      <a href="https://plasmacare.com/mon-compte" class="button">Gérer mes rendez-vous</a>
    </div>
    <div class="footer">
      <p>PlasmaCare - 123 Avenue des Soins, 75000 Paris</p>
      <p>© 2025 PlasmaCare. Tous droits réservés.</p>
    </div>
  </body>
  </html>
  ';

  -- Envoyer l'email via Mailtrap
  email_sent := send_email_via_mailtrap(
    appointment_info.user_email,
    email_subject,
    email_content
  );

  -- Enregistrer l'envoi d'email dans les logs
  IF email_sent THEN
    RAISE NOTICE 'Email de confirmation envoyé avec succès à % pour le rendez-vous %', 
      appointment_info.user_email, 
      appointment_info.id;
  ELSE
    RAISE WARNING 'Échec de l''envoi d''email à % pour le rendez-vous %', 
      appointment_info.user_email, 
      appointment_info.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activer l'extension http pour permettre les requêtes HTTP
CREATE EXTENSION IF NOT EXISTS http;

-- Créer un déclencheur pour envoyer l'email lorsqu'un rendez-vous est confirmé
DROP TRIGGER IF EXISTS appointment_confirmation_email_trigger ON appointments;
CREATE TRIGGER appointment_confirmation_email_trigger
AFTER UPDATE OF status ON appointments
FOR EACH ROW
WHEN (OLD.status != 'confirmed' AND NEW.status = 'confirmed')
EXECUTE FUNCTION send_appointment_confirmation_email();