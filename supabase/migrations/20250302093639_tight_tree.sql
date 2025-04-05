-- Fonction pour envoyer un email de confirmation de rendez-vous
CREATE OR REPLACE FUNCTION send_appointment_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  appointment_info RECORD;
  email_subject TEXT;
  email_content TEXT;
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

  -- Utiliser pg_notify pour envoyer l'email de manière asynchrone
  -- Dans un environnement de production, cela serait connecté à un service d'envoi d'emails
  PERFORM pg_notify(
    'send_email',
    json_build_object(
      'to', appointment_info.user_email,
      'subject', email_subject,
      'html_content', email_content
    )::text
  );

  -- Log l'envoi d'email dans la console (pour le développement)
  RAISE NOTICE 'Email de confirmation envoyé à % pour le rendez-vous %', 
    appointment_info.user_email, 
    appointment_info.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer un déclencheur pour envoyer l'email lorsqu'un rendez-vous est confirmé
DROP TRIGGER IF EXISTS appointment_confirmation_email_trigger ON appointments;
CREATE TRIGGER appointment_confirmation_email_trigger
AFTER UPDATE OF status ON appointments
FOR EACH ROW
WHEN (OLD.status != 'confirmed' AND NEW.status = 'confirmed')
EXECUTE FUNCTION send_appointment_confirmation_email();