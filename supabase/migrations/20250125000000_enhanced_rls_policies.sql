-- Enhanced RLS Policies for Security
-- This migration strengthens Row Level Security policies

-- Drop existing policies
drop policy if exists "Public read villages" on public.villages;
drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "Auth users manage leads" on public.leads;
drop policy if exists "Auth users manage tickets" on public.tickets;
drop policy if exists "Auth users manage photos" on public.ticket_photos;

-- Villages: Read-only for authenticated users
create policy "Authenticated read villages" on public.villages 
  for select using (auth.role() = 'authenticated');

-- Profiles: Users can read all profiles but only update their own
create policy "Authenticated read profiles" on public.profiles 
  for select using (auth.role() = 'authenticated');

create policy "Users update own profile" on public.profiles 
  for update using (auth.uid() = id);

create policy "Users insert own profile" on public.profiles 
  for insert with check (auth.uid() = id);

-- Leads: Authenticated users can manage leads
create policy "Authenticated manage leads" on public.leads 
  for all using (auth.role() = 'authenticated');

-- Tickets: Users can read all tickets, but only admins can create/update
create policy "Authenticated read tickets" on public.tickets 
  for select using (auth.role() = 'authenticated');

create policy "Admin manage tickets" on public.tickets 
  for all using (
    auth.role() = 'authenticated' and 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Runner update assigned tickets" on public.tickets 
  for update using (
    auth.role() = 'authenticated' and 
    assigned_to = auth.uid()
  );

-- Ticket Photos: Users can read all, but only upload to assigned tickets
create policy "Authenticated read ticket_photos" on public.ticket_photos 
  for select using (auth.role() = 'authenticated');

create policy "Users upload to assigned tickets" on public.ticket_photos 
  for insert with check (
    auth.role() = 'authenticated' and 
    exists (
      select 1 from public.tickets 
      where id = ticket_id and assigned_to = auth.uid()
    )
  );

-- Storage policies for photos bucket
drop policy if exists "Public read photos" on storage.objects;
drop policy if exists "Auth upload photos" on storage.objects;

create policy "Authenticated read photos" on storage.objects 
  for select using (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Authenticated upload photos" on storage.objects 
  for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Users delete own photos" on storage.objects 
  for delete using (bucket_id = 'photos' and auth.uid()::text = owner);