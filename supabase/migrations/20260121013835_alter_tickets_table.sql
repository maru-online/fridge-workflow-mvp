alter table public.tickets add column if not exists category text;
alter table public.tickets add column if not exists fridge_code text;
alter table public.tickets add column if not exists description text;
alter table public.tickets add column if not exists status text default 'open';
alter table public.tickets add column if not exists image_url text;
