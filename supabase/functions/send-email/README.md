# Configuration de l'envoi d'email

Pour activer l'envoi d'email des diagnostics à l'administrateur, suivez ces étapes :

1. Dans l'interface Supabase, allez dans "Settings" > "Edge Functions"
2. Sélectionnez la fonction "send-email"
3. Configurez les variables d'environnement suivantes :

```bash
SMTP_HOSTNAME=smtp.votreserveur.com
SMTP_PORT=587
SMTP_USERNAME=votre_username
SMTP_PASSWORD=votre_password
SMTP_FROM=no-reply@votredomaine.com
```

## Configuration recommandée

Pour l'envoi d'emails, nous recommandons d'utiliser un service comme :
- SendGrid (https://sendgrid.com)
- Mailgun (https://www.mailgun.com)
- Amazon SES (https://aws.amazon.com/ses)

Ces services offrent des APIs SMTP fiables et une bonne délivrabilité des emails.

## Sécurité

- Ne stockez jamais les identifiants SMTP directement dans le code
- Utilisez toujours les variables d'environnement de Supabase
- Activez TLS/SSL pour la connexion SMTP
- Limitez l'accès à la fonction Edge aux utilisateurs authentifiés via les politiques Supabase
