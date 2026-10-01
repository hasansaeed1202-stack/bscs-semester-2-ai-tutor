import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const workerUrl = process.env.VITE_TUTOR_API_URL?.trim()
if (!workerUrl) throw new Error('VITE_TUTOR_API_URL must be configured for the production build')

const assetsDirectory = fileURLToPath(new URL('../dist/assets/', import.meta.url))
const assetNames = await readdir(assetsDirectory)
const javascript = await Promise.all(
  assetNames.filter((name) => name.endsWith('.js')).map((name) => readFile(join(assetsDirectory, name), 'utf8')),
)

if (!javascript.some((asset) => asset.includes(workerUrl))) {
  throw new Error('Production assets do not contain the configured VITE_TUTOR_API_URL')
}

console.log('Production assets contain the configured Tutor Worker URL')
