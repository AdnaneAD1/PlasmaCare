import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

interface EmailPayload {
  to: string;
  subject: string;
  content: string;
}

serve(async (req) => {
  try {
    const { to, subject, content } = await req.json() as EmailPayload;

    // Vérifier les paramètres requis
    if (!to || !subject || !content) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Configurer le client SMTP
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOSTNAME') || '',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || '',
      password: Deno.env.get('SMTP_PASSWORD') || '',
    });

    // Envoyer l'email
    await client.send({
      from: Deno.env.get('SMTP_FROM') || '',
      to: to,
      subject: subject,
      content: content,
    });

    await client.close();

    return new Response(
      JSON.stringify({ message: 'Email envoyé avec succès' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur lors de l\'envoi de l\'email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
