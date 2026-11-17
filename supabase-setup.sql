-- =====================================================================
--  SPROUTED GRACE MINISTRY — Supabase setup
--  Use a NEW Supabase project for the church. Do not run this on any
--  other project.
--  Supabase → SQL Editor → New query → paste this whole file → Run.
--  Run it once on the fresh project.
-- =====================================================================

-- ---------- PROFILES (one per member) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Friend' check (char_length(display_name) between 1 and 40),
  username text check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  bio text check (char_length(bio) <= 160),
  avatar_url text,
  is_admin boolean not null default false,
  is_partner boolean not null default false,
  marketing_opt_in boolean not null default false,
  list_added_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index profiles_username_key on public.profiles (lower(username));

-- Make a profile when someone signs up
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_user text := nullif(trim(new.raw_user_meta_data->>'username'),'');
begin
  if v_user is not null and (v_user !~ '^[A-Za-z0-9_]{3,20}$'
      or exists (select 1 from public.profiles where lower(username) = lower(v_user))) then
    v_user := null;
  end if;
  insert into public.profiles (id, display_name, username, marketing_opt_in)
  values (new.id,
          left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''), split_part(new.email,'@',1)), 40),
          v_user,
          coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
create function public.is_partner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_partner or is_admin from public.profiles where id = auth.uid()), false);
$$;

alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
-- Members change their profile only through update_my_profile() below.
revoke insert, update, delete on public.profiles from anon, authenticated;

-- What other signed-in members can see (never the email)
create view public.public_profiles as
  select id, username, display_name, bio, avatar_url, is_admin, created_at
    from public.profiles where auth.uid() is not null;
revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;

create function public.my_profile() returns setof public.profiles
language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid();
$$;

create function public.update_my_profile(p_display_name text, p_username text, p_bio text, p_avatar_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if coalesce(trim(p_display_name),'') = '' then raise exception 'Please add a display name.'; end if;
  if p_username is not null and p_username !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Usernames are 3 to 20 letters, numbers, or _.'; end if;
  if p_username is not null and exists (select 1 from public.profiles where lower(username) = lower(p_username) and id <> auth.uid()) then
    raise exception 'That username is taken. Please try another.'; end if;
  if char_length(coalesce(p_bio,'')) > 160 then raise exception 'Your bio is too long.'; end if;
  if p_avatar_url is not null and p_avatar_url not like '%/storage/v1/object/public/avatars/' || auth.uid()::text || '/%' then
    raise exception 'Please upload your photo again.'; end if;
  update public.profiles set display_name = left(trim(p_display_name),40), username = p_username,
         bio = nullif(trim(p_bio),''), avatar_url = p_avatar_url
   where id = auth.uid();
end $$;

create function public.set_my_opt_in(p_on boolean) returns void
language sql security definer set search_path = public as $$
  update public.profiles set marketing_opt_in = p_on where id = auth.uid();
$$;

create function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

-- Sign in with a username: gives back the email only when the password is right.
create function public.login_email(p_username text, p_password text) returns text
language sql stable security definer set search_path = public, extensions as $$
  select u.email from auth.users u join public.profiles p on p.id = u.id
   where lower(p.username) = lower(p_username)
     and u.encrypted_password = extensions.crypt(p_password, u.encrypted_password)
   limit 1;
$$;

grant execute on function public.my_profile(), public.update_my_profile(text,text,text,text), public.set_my_opt_in(boolean) to authenticated;
grant execute on function public.username_available(text), public.login_email(text,text) to anon, authenticated;

-- ---------- ADMIN: MEMBERS ----------
create function public.admin_members()
returns table (id uuid, email text, display_name text, username text, role text, joined timestamptz,
               email_confirmed boolean, opted_in boolean, list_added_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  return query
    select p.id, u.email::text, p.display_name, p.username,
           case when p.is_admin then 'Admin' when p.is_partner then 'Partner' else 'Member' end,
           p.created_at, u.email_confirmed_at is not null, p.marketing_opt_in, p.list_added_at
      from public.profiles p join auth.users u on u.id = p.id
     order by p.created_at desc;
end $$;

create function public.admin_set_admin(p_id uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  if p_id = auth.uid() and not p_on then raise exception 'You cannot remove your own admin.'; end if;
  update public.profiles set is_admin = p_on where id = p_id;
end $$;

create function public.admin_set_partner(p_id uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  update public.profiles set is_partner = p_on where id = p_id;
end $$;

create function public.admin_mark_added(p_ids uuid[], p_added boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  update public.profiles set list_added_at = case when p_added then now() else null end where id = any(p_ids);
end $$;

revoke all on function public.admin_members(), public.admin_set_admin(uuid,boolean), public.admin_set_partner(uuid,boolean),
                       public.admin_mark_added(uuid[],boolean) from public, anon;
grant execute on function public.admin_members(), public.admin_set_admin(uuid,boolean), public.admin_set_partner(uuid,boolean),
                       public.admin_mark_added(uuid[],boolean) to authenticated;

-- ---------- LIBRARY ----------
create table public.library_rows (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 40),
  sort int not null default 0
);
create table public.volumes (
  id text primary key,
  title text not null,
  subtitle text,
  status text not null default 'live' check (status in ('live','hidden')),
  sort int not null default 0,
  kind text not null default 'pdf' check (kind in ('pdf','audio','video','soon')),
  tier text not null default 'free' check (tier in ('free','member','partner')),
  row_id bigint references public.library_rows(id) on delete set null,
  cover_url text,
  created_at timestamptz not null default now()
);
create table public.library_files (
  volume_id text primary key references public.volumes(id) on delete cascade,
  bucket text check (bucket in ('library-public','library-sealed','site')),
  file_path text,
  video_url text
);
alter table public.library_rows enable row level security;
alter table public.volumes enable row level security;
alter table public.library_files enable row level security;
create policy "anyone reads rows" on public.library_rows for select using (true);
create policy "admin edits rows" on public.library_rows for all using (public.is_admin()) with check (public.is_admin());
create policy "anyone reads live items" on public.volumes for select using (status <> 'hidden' or public.is_admin());
create policy "admin edits items" on public.volumes for all using (public.is_admin()) with check (public.is_admin());
create policy "open files by access" on public.library_files for select using (
  public.is_admin() or exists (select 1 from public.volumes v where v.id = volume_id and v.status <> 'hidden' and (
    v.tier = 'free' or (v.tier = 'member' and auth.uid() is not null) or (v.tier = 'partner' and public.is_partner()))));
create policy "admin edits files" on public.library_files for all using (public.is_admin()) with check (public.is_admin());

insert into public.library_rows (name, sort) values
  ('The Red Letters',1), ('Gospel of Thomas',2), ('Teachings',3), ('Study Guides',4), ('Coming Soon',5);

-- ---------- FILE STORAGE ----------
insert into storage.buckets (id, name, public) values
  ('library-public','library-public', true),
  ('library-sealed','library-sealed', false),
  ('avatars','avatars', true)
on conflict (id) do nothing;

create policy "admin uploads library files" on storage.objects for insert to authenticated
  with check (bucket_id in ('library-public','library-sealed') and public.is_admin());
create policy "admin updates library files" on storage.objects for update to authenticated
  using (bucket_id in ('library-public','library-sealed') and public.is_admin());
create policy "admin deletes library files" on storage.objects for delete to authenticated
  using (bucket_id in ('library-public','library-sealed') and public.is_admin());
create policy "admin reads private files" on storage.objects for select to authenticated
  using (bucket_id = 'library-sealed' and public.is_admin());
create policy "members open private files they may see" on storage.objects for select to authenticated
  using (bucket_id = 'library-sealed' and exists (
    select 1 from public.library_files f join public.volumes v on v.id = f.volume_id
     where f.bucket = 'library-sealed' and f.file_path = storage.objects.name and v.status <> 'hidden'
       and (v.tier = 'member' or (v.tier = 'partner' and public.is_partner()))));
create policy "members upload own photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members delete own photo" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- FELLOWSHIP ----------
create table public.forum_rooms (
  id bigint generated always as identity primary key,
  name text not null,
  sort int not null default 0,
  kind text                                   -- 'prayer' turns on "Prayed for this" and hidden names
);
create table public.forum_threads (
  id bigint generated always as identity primary key,
  room_id bigint not null references public.forum_rooms(id),
  author_id uuid references public.profiles(id) on delete cascade,   -- empty when the name is hidden
  anonymous boolean not null default false,
  title text not null check (char_length(title) between 1 and 140),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
-- Who wrote a hidden-name prayer request. Only admins (and the writer) can read this.
create table public.thread_secret_authors (
  thread_id bigint primary key references public.forum_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade
);
create table public.forum_posts (
  id bigint generated always as identity primary key,
  thread_id bigint not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create table public.prayers (
  thread_id bigint not null references public.forum_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
alter table public.forum_rooms enable row level security;
alter table public.forum_threads enable row level security;
alter table public.thread_secret_authors enable row level security;
alter table public.forum_posts enable row level security;
alter table public.prayers enable row level security;

create policy "members read rooms" on public.forum_rooms for select using (auth.uid() is not null);
create policy "admin edits rooms" on public.forum_rooms for all using (public.is_admin()) with check (public.is_admin());
create policy "members read threads" on public.forum_threads for select using (auth.uid() is not null);
create policy "writer or admin deletes thread" on public.forum_threads for delete using (
  public.is_admin() or author_id = auth.uid()
  or exists (select 1 from public.thread_secret_authors s where s.thread_id = forum_threads.id and s.author_id = auth.uid()));
-- New threads go through create_thread() so hidden names stay hidden.
revoke insert, update on public.forum_threads from anon, authenticated;
create policy "admin or writer reads hidden author" on public.thread_secret_authors for select using (public.is_admin() or author_id = auth.uid());
create policy "members read replies" on public.forum_posts for select using (auth.uid() is not null);
create policy "members reply" on public.forum_posts for insert with check (auth.uid() is not null and author_id = auth.uid());
create policy "writer or admin deletes reply" on public.forum_posts for delete using (author_id = auth.uid() or public.is_admin());
revoke update on public.forum_posts from anon, authenticated;
create policy "members see own prayers" on public.prayers for select using (user_id = auth.uid() or public.is_admin());
create policy "members pray" on public.prayers for insert with check (user_id = auth.uid());
create policy "members undo prayer" on public.prayers for delete using (user_id = auth.uid());

create function public.create_thread(p_room bigint, p_title text, p_body text, p_anon boolean default false)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_kind text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select kind into v_kind from public.forum_rooms where id = p_room;
  if not found then raise exception 'That room was not found.'; end if;
  if p_anon and coalesce(v_kind,'') <> 'prayer' then p_anon := false; end if;   -- hidden names only for prayer requests
  insert into public.forum_threads (room_id, author_id, anonymous, title, body)
  values (p_room, case when p_anon then null else auth.uid() end, p_anon, trim(p_title), trim(p_body))
  returning id into v_id;
  if p_anon then insert into public.thread_secret_authors (thread_id, author_id) values (v_id, auth.uid()); end if;
  return v_id;
end $$;

create function public.prayer_counts(p_ids bigint[])
returns table (thread_id bigint, n int, mine boolean)
language sql stable security definer set search_path = public as $$
  select t.id, (select count(*)::int from public.prayers p where p.thread_id = t.id),
         exists (select 1 from public.prayers p where p.thread_id = t.id and p.user_id = auth.uid())
    from public.forum_threads t where t.id = any(p_ids) and auth.uid() is not null;
$$;
revoke all on function public.create_thread(bigint,text,text,boolean), public.prayer_counts(bigint[]) from public, anon;
grant execute on function public.create_thread(bigint,text,text,boolean), public.prayer_counts(bigint[]) to authenticated;

insert into public.forum_rooms (name, sort, kind) values
  ('Welcome',1,null), ('Prayer Requests',2,'prayer'), ('Testimonies',3,null), ('Bible Study',4,null), ('General',5,null);

-- ---------- LIVE TIMES (extra times the admin posts) ----------
create table public.live_times (
  id bigint generated always as identity primary key,
  starts_at timestamptz not null,
  note text check (char_length(note) <= 80),
  created_at timestamptz not null default now()
);
alter table public.live_times enable row level security;
create policy "anyone reads live times" on public.live_times for select using (true);
create policy "admin edits live times" on public.live_times for all using (public.is_admin()) with check (public.is_admin());

-- ---------- BIBLE BACKUPS (highlights, bookmarks, notes, plans) ----------
create table public.bible_backups (
  user_id uuid primary key default auth.uid() references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 2000000),
  updated_at timestamptz not null default now()
);
alter table public.bible_backups enable row level security;
create policy "own backup" on public.bible_backups for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
--  MAKE YOURSELF ADMIN
--  1. Open the app and make your account. Tap the link in the email.
--  2. Come back here, put your email in the line below, and run ONLY that line:
--
--     update public.profiles set is_admin = true
--      where id = (select id from auth.users where email = 'admin@sproutedgrace.net');
--
--  3. Reload the app. You will see "Admin tools" on your Account page.
-- =====================================================================
