-- Notification Triggers Migration
-- Sets up scheduled tasks for sending appointment reminders

-- Enable pg_cron extension (requires Supabase Pro or self-hosted)
-- This extension allows scheduling SQL jobs

-- Note: pg_cron is enabled at the Supabase platform level
-- The following creates the infrastructure for notification triggers

-- Create a table to track scheduled notifications
create table if not exists public.scheduled_notifications (
  id uuid default gen_random_uuid() primary key,
  ticket_id bigint references public.tickets(id) on delete cascade,
  lead_id bigint references public.leads(id) on delete cascade,
  notification_type text not null, -- 'appointment_reminder', 'follow_up', 'job_completed'
  whatsapp_id text not null,
  scheduled_for timestamp with time zone not null,
  sent_at timestamp with time zone,
  status text default 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  error_message text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.scheduled_notifications enable row level security;

-- RLS Policy
create policy "Auth users manage scheduled notifications" 
  on public.scheduled_notifications 
  for all 
  using (auth.role() = 'authenticated');

-- Index for efficient querying of pending notifications
create index idx_scheduled_notifications_pending 
  on public.scheduled_notifications(scheduled_for) 
  where status = 'pending';

-- Index for ticket lookups
create index idx_scheduled_notifications_ticket 
  on public.scheduled_notifications(ticket_id);

-- Function to auto-create appointment reminders when a ticket is scheduled
create or replace function create_appointment_reminder()
returns trigger as $$
declare
  lead_whatsapp text;
begin
  -- Only create reminder if scheduled_for is set and in the future
  if new.scheduled_for is not null and new.scheduled_for > now() then
    -- Get the lead's WhatsApp ID
    select whatsapp_id into lead_whatsapp
    from public.leads
    where id = new.lead_id;
    
    if lead_whatsapp is not null then
      -- Create a reminder for 24 hours before the appointment
      insert into public.scheduled_notifications (
        ticket_id,
        lead_id,
        notification_type,
        whatsapp_id,
        scheduled_for
      ) values (
        new.id,
        new.lead_id,
        'appointment_reminder',
        lead_whatsapp,
        new.scheduled_for - interval '24 hours'
      )
      on conflict do nothing;
      
      -- Create a reminder for 1 hour before the appointment
      insert into public.scheduled_notifications (
        ticket_id,
        lead_id,
        notification_type,
        whatsapp_id,
        scheduled_for
      ) values (
        new.id,
        new.lead_id,
        'appointment_reminder',
        lead_whatsapp,
        new.scheduled_for - interval '1 hour'
      )
      on conflict do nothing;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create reminders when ticket is scheduled
create trigger on_ticket_scheduled
  after insert or update of scheduled_for on public.tickets
  for each row
  when (new.scheduled_for is not null)
  execute function create_appointment_reminder();

-- Function to auto-notify on job completion
create or replace function notify_job_completed()
returns trigger as $$
declare
  lead_whatsapp text;
begin
  -- Only trigger when status changes to 'completed'
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    -- Get the lead's WhatsApp ID
    select whatsapp_id into lead_whatsapp
    from public.leads
    where id = new.lead_id;
    
    if lead_whatsapp is not null then
      -- Create immediate notification
      insert into public.scheduled_notifications (
        ticket_id,
        lead_id,
        notification_type,
        whatsapp_id,
        scheduled_for
      ) values (
        new.id,
        new.lead_id,
        'job_completed',
        lead_whatsapp,
        now()
      );
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for job completion notifications
create trigger on_job_completed
  after update of status on public.tickets
  for each row
  when (new.status = 'completed')
  execute function notify_job_completed();

-- Comment explaining how to process notifications
comment on table public.scheduled_notifications is 
'Scheduled notifications to be processed by a cron job or Edge Function.
Process notifications where scheduled_for <= now() and status = pending.
Call the notifications Edge Function for each notification.';
