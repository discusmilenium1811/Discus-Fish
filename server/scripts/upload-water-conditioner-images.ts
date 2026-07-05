import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { supabaseAdmin, STORAGE_BUCKET } from '../src/lib/supabase.js'

const here = dirname(fileURLToPath(import.meta.url))
const imagesDir = join(here, '../../storage/product-images/products/discusfood')
const files = ['natural-humin-v2.png', 'anti-tox-v2.png', 'catappa-royal-v2.png']
const publicBase = `${process.env.SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/products/discusfood`

for (const file of files) {
  const buffer = await readFile(join(imagesDir, file))
  const path = `products/discusfood/${file}`
  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(path, buffer, {
    contentType: 'image/png',
    upsert: true,
  })

  if (error) throw new Error(`${path}: ${error.message}`)
  console.log(`Uploaded ${path}`)
}

const products = [
  ['natural-humin', 'natural-humin-v2.png'],
  ['anti-tox', 'anti-tox-v2.png'],
  ['royal-catappa', 'catappa-royal-v2.png'],
  ['royal-catappa-5000ml', 'catappa-royal-v2.png'],
] as const

for (const [slug, file] of products) {
  const { error } = await supabaseAdmin
    .from('products')
    .update({ image_url: `${publicBase}/${file}`, updated_at: new Date().toISOString() })
    .eq('slug', slug)

  if (error) throw new Error(`${slug}: ${error.message}`)
  console.log(`Updated ${slug}`)
}
