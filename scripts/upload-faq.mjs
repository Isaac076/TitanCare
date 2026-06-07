#!/usr/bin/env node
/**
 * Script de un solo uso para subir los PDFs de FAQ a Supabase Storage.
 * Ejecutar desde la carpeta raíz del proyecto:
 *   node scripts/upload-faq.mjs
 *
 * Requiere que las variables de entorno estén en .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Leer .env.local manualmente
import { config } from 'dotenv'
config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

const FILES = [
  {
    localPath: resolve(__dirname, '../Preguntas_Frecuentes.pdf'),
    storagePath: 'Global/faq_es.pdf',
    label: 'FAQ Español',
  },
  {
    localPath: resolve(__dirname, '../Frequently_Asked_Question.pdf'),
    storagePath: 'Global/faq_en.pdf',
    label: 'FAQ English',
  },
]

async function upload() {
  for (const file of FILES) {
    console.log(`\n📤 Subiendo ${file.label}...`)
    const buffer = readFileSync(file.localPath)

    const { error } = await supabase.storage
      .from('patient-documents')
      .upload(file.storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error(`  ❌ Error: ${error.message}`)
    } else {
      console.log(`  ✅ Subido en: ${file.storagePath}`)
    }
  }
  console.log('\n✅ Listo. Ahora corre la migración SQL 004_faq_bilingual.sql en Supabase.')
}

upload()
