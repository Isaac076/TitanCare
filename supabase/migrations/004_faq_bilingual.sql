-- ============================================================
-- TitanCare Migration 004
-- FAQ bilingüe: faq_es y faq_en en global_documents
-- ============================================================

-- Ampliar el CHECK constraint para aceptar faq_es y faq_en
-- (primero eliminar el constraint existente, luego recrearlo)
alter table global_documents
  drop constraint if exists global_documents_doc_type_check;

alter table global_documents
  add constraint global_documents_doc_type_check
  check (doc_type in ('mri', 'airport', 'postop', 'faq', 'faq_es', 'faq_en'));

-- Insertar los dos documentos FAQ
-- (si ya existen, actualizar el storage_path)
insert into global_documents (doc_type, storage_path, file_name)
values
  ('faq_es', 'Global/faq_es.pdf', 'Preguntas Frecuentes'),
  ('faq_en', 'Global/faq_en.pdf', 'Frequently Asked Questions')
on conflict (doc_type) do update
  set storage_path = excluded.storage_path,
      file_name    = excluded.file_name,
      updated_at   = now();
