-- Conversation States Table
-- Stores WhatsApp conversation state for managing multi-step flows

-- Create enum for conversation flow types
create type conversation_flow_type as enum ('sell', 'repair', 'info', 'idle');

-- Create enum for conversation steps
create type conversation_step as enum (
  'welcome',
  'awaiting_name',
  'awaiting_village',
  'awaiting_fridge_condition',
  'awaiting_offer_response',
  'awaiting_repair_description',
  'awaiting_repair_location',
  'awaiting_repair_photos',
  'completed',
  'cancelled'
);

-- Conversation states table
create table public.conversation_states (
  id uuid default gen_random_uuid() primary key,
  whatsapp_id text not null unique,
  lead_id bigint references public.leads(id) on delete set null,
  flow_type conversation_flow_type default 'idle',
  current_step conversation_step default 'welcome',
  collected_data jsonb default '{}'::jsonb,
  last_message_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.conversation_states enable row level security;

-- RLS Policy: Service role can manage all conversation states
-- Edge functions use service role, so they can read/write
create policy "Service role manages conversation states" 
  on public.conversation_states 
  for all 
  using (true);

-- Index for quick lookups by WhatsApp ID
create index idx_conversation_states_whatsapp_id on public.conversation_states(whatsapp_id);

-- Index for expired states cleanup
create index idx_conversation_states_expires_at on public.conversation_states(expires_at) 
  where expires_at is not null;

-- Index for lead lookups
create index idx_conversation_states_lead_id on public.conversation_states(lead_id) 
  where lead_id is not null;

-- Function to update updated_at timestamp
create or replace function update_conversation_state_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_conversation_states_updated_at
  before update on public.conversation_states
  for each row
  execute function update_conversation_state_updated_at();
