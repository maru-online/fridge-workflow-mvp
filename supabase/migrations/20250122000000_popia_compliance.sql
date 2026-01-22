-- POPIA Compliance Migration
-- Adds consent management and data retention fields

-- Add consent fields to leads table
alter table public.leads
  add column if not exists consent_given boolean default false,
  add column if not exists consent_date timestamp with time zone,
  add column if not exists consent_withdrawn boolean default false,
  add column if not exists consent_withdrawn_date timestamp with time zone;

-- Add data retention fields
alter table public.leads
  add column if not exists archived_at timestamp with time zone,
  add column if not exists retention_expires_at timestamp with time zone;

-- Set default retention to 2 years from creation
update public.leads
  set retention_expires_at = created_at + interval '2 years'
  where retention_expires_at is null;

-- Create function to archive old leads
create or replace function archive_old_leads()
returns void as $$
begin
  update public.leads
  set archived_at = now(),
      status = 'archived'
  where retention_expires_at < now()
    and archived_at is null
    and status != 'archived';
end;
$$ language plpgsql;

-- Create index for retention queries
create index if not exists idx_leads_retention_expires on public.leads(retention_expires_at)
  where archived_at is null;

-- Create index for consent queries
create index if not exists idx_leads_consent on public.leads(consent_given, consent_withdrawn);
