import { LowSync } from 'lowdb'
import { JSONFileSync } from 'lowdb/node'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = join(__dirname, '..', 'data')
mkdirSync(DATA_DIR, { recursive: true })

const adapter = new JSONFileSync(join(DATA_DIR, 'db.json'))

const defaultData = {
  users: [],
  files: [],
  shareLinks: [],
  downloadLogs: [],
  refreshTokens: [],
}

export const db = new LowSync(adapter, defaultData)

export function initDatabase() {
  db.read()
  // Ensure all collections exist
  db.data.users ??= []
  db.data.files ??= []
  db.data.shareLinks ??= []
  db.data.downloadLogs ??= []
  db.data.refreshTokens ??= []
  db.write()
  console.log('✅ Database initialized (lowdb)')
}

// Helper: get fresh data
export function getData() {
  db.read()
  return db.data
}

// Helper: persist data
export function saveData() {
  db.write()
}
