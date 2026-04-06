-- =====================
-- NOCTRA SEO — Multi-site Management
-- Migration: 20260406000000_add_multisite.sql
--
-- NOTE: This project has no "sites" table. The "site" concept in the UI
--       is a combination of a "project" + its "domain".
--       - projects.id        = site identifier for routing (/dashboard/[projectId])
--       - domains.site_id    = tracker ID (text, used in data-site-id attribute)
--       - projects.name      = display name
--       - domains.hostname   = site URL
-- =====================

-- ----------------------
-- 1. Add columns to projects
-- ----------------------

ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_default   boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS favicon_url  text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_email  text;

-- Ensure only one default project per org (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_org_default
  ON projects (org_id) WHERE is_default = true;

-- ----------------------
-- 2. project_invites (structure only — invite logic is roadmap)
-- ----------------------

CREATE TABLE IF NOT EXISTS project_invites (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invited_email  text        NOT NULL,
  role           text        NOT NULL DEFAULT 'viewer'
                             CHECK (role IN ('admin', 'member', 'viewer')),
  accepted_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_invites_org_isolation" ON project_invites
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.org_id = current_user_org_id()
    )
  );

-- ----------------------
-- 3. Trigger: auto-create Noctra Studio setup for hello@noctra.studio
--
-- Fires after INSERT on auth.users.
-- Creates: organization → public user record → project → domain
-- All in one transaction so onboarding is skipped for this account.
-- ----------------------

CREATE OR REPLACE FUNCTION public.handle_noctra_owner_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id     uuid;
  v_project_id uuid;
BEGIN
  -- Only act for the owner account
  IF NEW.email <> 'hello@noctra.studio' THEN
    RETURN NEW;
  END IF;

  -- 1. Organization (idempotent on slug conflict)
  INSERT INTO public.organizations (name, slug, plan, onboarding_completed)
  VALUES ('Noctra Studio', 'noctra-studio', 'agency', true)
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name
  RETURNING id INTO v_org_id;

  -- If conflict, fetch existing org id
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'noctra-studio';
  END IF;

  -- 2. Public user record (links auth.users → org)
  INSERT INTO public.users (id, org_id, full_name, role)
  VALUES (NEW.id, v_org_id, 'Manu', 'owner')
  ON CONFLICT (id) DO UPDATE
    SET org_id = v_org_id, role = 'owner';

  -- 3. Default project
  INSERT INTO public.projects (org_id, name, is_default, owner_email, created_by)
  VALUES (v_org_id, 'Noctra Studio', true, 'hello@noctra.studio', NEW.id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_project_id;

  -- If conflict (project already exists), fetch it
  IF v_project_id IS NULL THEN
    SELECT id INTO v_project_id
    FROM public.projects
    WHERE org_id = v_org_id AND is_default = true
    LIMIT 1;
  END IF;

  -- 4. Domain (idempotent)
  INSERT INTO public.domains (project_id, hostname)
  VALUES (v_project_id, 'noctra.studio')
  ON CONFLICT (project_id, hostname) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_noctra ON auth.users;
CREATE TRIGGER on_auth_user_created_noctra
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_noctra_owner_signup();

-- ----------------------
-- 4. RLS on projects — verify existing policy covers user_id
--
-- The existing "org_isolation" policy on projects uses:
--   org_id = current_user_org_id()
-- which already limits access to the authenticated user's org.
-- No changes needed to existing policies.
-- ----------------------

-- ----------------------
-- 5. Index for listing projects by org (frequently queried)
-- ----------------------

CREATE INDEX IF NOT EXISTS idx_projects_org_created
  ON projects (org_id, is_default DESC, created_at ASC);
