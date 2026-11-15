-- RLS dan Supabase Realtime.
--
-- Backend memakai role `postgres` (melewati RLS), sehingga RLS di sini adalah
-- pertahanan berlapis untuk akses melalui Supabase Client/PostgREST/Realtime.
-- Otorisasi utama tetap dilakukan di application layer.

alter table public.profiles               enable row level security;
alter table public.counselor_profiles     enable row level security;
alter table public.services               enable row level security;
alter table public.service_methods        enable row level security;
alter table public.counselor_services     enable row level security;
alter table public.time_slots             enable row level security;
alter table public.bookings               enable row level security;
alter table public.payments               enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.counseling_sessions    enable row level security;
alter table public.chat_messages          enable row level security;
alter table public.zoom_meetings          enable row level security;

-- Fungsi bantu SECURITY DEFINER agar policy dapat membaca tabel sesi/booking
-- tanpa terhalang RLS pada tabel tersebut.
create or replace function public.is_session_participant(p_session_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.counseling_sessions cs
    join public.bookings b on b.id = cs.booking_id
    where cs.id = p_session_id
      and (b.patient_id = auth.uid() or b.counselor_id = auth.uid())
  );
$$;

grant execute on function public.is_session_participant(uuid) to authenticated;

-- Satu-satunya policy: peserta sesi boleh membaca pesan sesinya.
-- Tidak ada policy INSERT/UPDATE/DELETE: penulisan hanya lewat backend.
-- Admin tidak memiliki policy sehingga tidak dapat membaca isi percakapan.
drop policy if exists chat_messages_select_participant on public.chat_messages;

create policy chat_messages_select_participant
on public.chat_messages
for select
to authenticated
using (public.is_session_participant(session_id));

-- Realtime membutuhkan replika identitas penuh agar filter `session_id`
-- bekerja pada event perubahan.
alter table public.chat_messages replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end;
$$;
