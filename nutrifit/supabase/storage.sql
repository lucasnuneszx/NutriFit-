-- NutriFit+ - Supabase Storage (bucket + policies)
-- Rode no SQL Editor do Supabase.

-- Bucket para imagens de refeições
insert into storage.buckets (id, name, public)
values ('food', 'food', false)
on conflict (id) do nothing;

-- Policies: permitir que o usuário gerencie apenas arquivos na pasta do seu user_id
-- Convenção: path = "<user_id>/<timestamp>-<filename>"

drop policy if exists "food_insert_own_folder" on storage.objects;
create policy "food_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "food_select_own_folder" on storage.objects;
create policy "food_select_own_folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "food_update_own_folder" on storage.objects;
create policy "food_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "food_delete_own_folder" on storage.objects;
create policy "food_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
);

