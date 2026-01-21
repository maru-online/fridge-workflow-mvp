do $$ begin
  create table if not exists public.tickets (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    fridge_code text not null,
    category text not null,
    description text,
    status text not null default 'open',
    image_url text
  );
exception
  when duplicate_table then null;
end $$;

-- Policies (drop and recreate to be safe)
drop policy if exists "Enable insert for all users" on public.tickets;
create policy "Enable insert for all users" on public.tickets for insert to public with check (true);

drop policy if exists "Enable select for all users" on public.tickets;
create policy "Enable select for all users" on public.tickets for select to public using (true);

alter table public.tickets enable row level security;
