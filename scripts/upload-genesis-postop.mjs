#!/usr/bin/env node
/**
 * Subir PDF de cuidados post-op Genesis a Supabase Storage.
 * Ejecutar desde la raíz del proyecto:
 *   node scripts/upload-genesis-postop.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function run() {
  // 1. Subir PDF a Storage
  console.log('📤 Subiendo PDF Genesis post-op...')
  const buffer = readFileSync(resolve(__dirname, '../Cuidados_Postoperatorios_Genesis.pdf'))

  const { error: uploadError } = await supabase.storage
    .from('patient-documents')
    .upload('Global/postop_genesis.pdf', buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    console.error('❌ Error al subir:', uploadError.message)
    process.exit(1)
  }
  console.log('✅ Subido: Global/postop_genesis.pdf')

  // 2. Registrar en global_documents
  console.log('📝 Registrando en global_documents...')
  const { error: dbError } = await supabase
    .from('global_documents')
    .upsert({
      doc_type: 'postop_genesis',
      storage_path: 'Global/postop_genesis.pdf',
      file_name: 'Cuidados Post-Op Genesis',
    }, { onConflict: 'doc_type' })

  if (dbError) {
    console.error('❌ Error en DB:', dbError.message)
    process.exit(1)
  }
  console.log('✅ Registrado en global_documents')
  console.log('\n✅ Listo. Ahora corre la migración SQL 005_postop_genesis.sql en Supabase.')
}

run()
