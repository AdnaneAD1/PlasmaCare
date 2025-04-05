-- Ajout d'une colonne pour suivre le statut de complétion des traitements
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;

-- Ajout d'une colonne pour le nombre de séances recommandées par traitement
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS recommended_sessions integer DEFAULT 1;

-- Ajout d'une colonne pour stocker l'email de l'admin qui doit recevoir les diagnostics
CREATE TABLE IF NOT EXISTS admin_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_email text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent accéder aux paramètres
CREATE POLICY "Only admins can view settings"
    ON admin_settings FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can modify settings"
    ON admin_settings FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Mettre à jour les traitements existants avec le nombre de séances recommandées
UPDATE treatments 
SET recommended_sessions = 
    CASE 
        WHEN category = 'alopecie' THEN 10
        WHEN category = 'blepharochalasis' THEN 6
        ELSE 1
    END;
