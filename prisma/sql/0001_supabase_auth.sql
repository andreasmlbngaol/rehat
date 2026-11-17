-- Trigger pembuatan profil otomatis saat user Supabase Auth dibuat.
-- Dijalankan di luar Prisma Migrate karena menyentuh schema `auth`.
--
-- Keamanan: peran hanya dibaca dari `raw_app_meta_data`, yang hanya dapat
-- ditulis oleh service role. `raw_user_meta_data` dapat dikirim sendiri oleh
-- pengguna saat signup sehingga tidak boleh dipercaya.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    is_active,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    case
      when new.raw_app_meta_data->>'role' = 'counselor' then 'counselor'::public."UserRole"
      when new.raw_app_meta_data->>'role' = 'admin' then 'admin'::public."UserRole"
      else 'patient'::public."UserRole"
    end,
    true,
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
