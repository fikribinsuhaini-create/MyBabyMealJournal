create table if not exists public.baby_profiles (
  id text primary key,
  baby_name text not null default '',
  birth_date text not null default ''
);

create table if not exists public.menu_planner (
  id text primary key,
  week text not null default '',
  age_category text not null default '',
  date text not null default '',
  day text not null default '',
  menu text not null default ''
);

create table if not exists public.feeding_schedule (
  id text primary key,
  week text not null default '',
  age_category text not null default '',
  date text not null default '',
  day text not null default '',
  breakfast text not null default '',
  lunch text not null default '',
  evening text not null default '',
  dinner text not null default ''
);

create table if not exists public.recipes (
  id text primary key,
  title text not null default '',
  image_url text not null default '',
  age_category text not null default '',
  category text not null default '',
  author text not null default '',
  ingredients text not null default '',
  instructions text not null default '',
  notes text not null default ''
);

-- Add the menu-planner "created by" tag to installs created before this column existed.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'recipes' and column_name = 'author'
  ) then
    alter table public.recipes add column author text not null default '';
  end if;
end $$;

create table if not exists public.food_tracker (
  id text primary key,
  food_name text not null default '',
  introduced_date text not null default '',
  status text not null default '',
  reaction text not null default '',
  notes text not null default '',
  image_urls text[] not null default '{}'
);

-- Migrate existing single-photo installs to the multi-photo column.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'food_tracker' and column_name = 'image_url'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'food_tracker' and column_name = 'image_urls'
    ) then
      alter table public.food_tracker add column image_urls text[] not null default '{}';
    end if;

    update public.food_tracker
    set image_urls = array[image_url]
    where coalesce(image_url, '') <> '' and coalesce(array_length(image_urls, 1), 0) = 0;

    alter table public.food_tracker drop column image_url;
  end if;
end $$;

create table if not exists public.food_library (
  id text primary key,
  food_name text not null default '',
  category text not null default '',
  tried_status text not null default 'Belum Cuba'
);

-- Add the manual tried/untried tick to installs created before this column existed.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'food_library' and column_name = 'tried_status'
  ) then
    alter table public.food_library add column tried_status text not null default 'Belum Cuba';
  end if;
end $$;

alter table public.baby_profiles enable row level security;
alter table public.menu_planner enable row level security;
alter table public.feeding_schedule enable row level security;
alter table public.recipes enable row level security;
alter table public.food_tracker enable row level security;
alter table public.food_library enable row level security;

drop policy if exists "baby_profiles public all" on public.baby_profiles;
create policy "baby_profiles public all" on public.baby_profiles for all to anon, authenticated using (true) with check (true);

drop policy if exists "menu_planner public all" on public.menu_planner;
create policy "menu_planner public all" on public.menu_planner for all to anon, authenticated using (true) with check (true);

drop policy if exists "feeding_schedule public all" on public.feeding_schedule;
create policy "feeding_schedule public all" on public.feeding_schedule for all to anon, authenticated using (true) with check (true);

drop policy if exists "recipes public all" on public.recipes;
create policy "recipes public all" on public.recipes for all to anon, authenticated using (true) with check (true);

drop policy if exists "food_tracker public all" on public.food_tracker;
create policy "food_tracker public all" on public.food_tracker for all to anon, authenticated using (true) with check (true);

drop policy if exists "food_library public all" on public.food_library;
create policy "food_library public all" on public.food_library for all to anon, authenticated using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'asytar-food-journal',
  'asytar-food-journal',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "baby food images public read" on storage.objects;
create policy "baby food images public read" on storage.objects for select to public using (bucket_id = 'asytar-food-journal');

drop policy if exists "baby food images public insert" on storage.objects;
create policy "baby food images public insert" on storage.objects for insert to anon, authenticated with check (bucket_id = 'asytar-food-journal');

drop policy if exists "baby food images public update" on storage.objects;
create policy "baby food images public update" on storage.objects for update to anon, authenticated using (bucket_id = 'asytar-food-journal') with check (bucket_id = 'asytar-food-journal');

drop policy if exists "baby food images public delete" on storage.objects;
create policy "baby food images public delete" on storage.objects for delete to anon, authenticated using (bucket_id = 'asytar-food-journal');
