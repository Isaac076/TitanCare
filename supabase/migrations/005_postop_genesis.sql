-- ============================================================
-- TitanCare Migration 005
-- Post-Op específico para Genesis
-- ============================================================

alter table global_documents
  drop constraint if exists global_documents_doc_type_check;

alter table global_documents
  add constraint global_documents_doc_type_check
  check (doc_type in ('mri', 'airport', 'postop', 'postop_genesis', 'faq', 'faq_es', 'faq_en'));

insert into global_documents (doc_type, storage_path, file_name)
values ('postop_genesis', 'Global/postop_genesis.pdf', 'Cuidados Post-Op Genesis')
on conflict (doc_type) do update
  set storage_path = excluded.storage_path,
      file_name    = excluded.file_name;
