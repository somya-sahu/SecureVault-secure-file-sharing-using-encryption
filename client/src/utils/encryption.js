/**
 * SecureVault Client-Side Encryption
 * Uses Web Crypto API with AES-256-GCM for file encryption/decryption
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // bytes for GCM

/**
 * Generate a random AES-256 key
 */
export async function generateKey() {
  return await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

/**
 * Export CryptoKey to base64 string
 */
export async function exportKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToBase64(raw)
}

/**
 * Import key from base64 string
 */
export async function importKey(keyBase64) {
  const raw = base64ToArrayBuffer(keyBase64)
  return await crypto.subtle.importKey(
    'raw', raw,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Derive key from password using PBKDF2
 */
export async function deriveKeyFromPassword(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt || crypto.getRandomValues(new Uint8Array(16)),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a file
 * Returns: { encryptedBlob, iv, keyBase64, checksum }
 */
export async function encryptFile(file, key) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const fileData = await file.arrayBuffer()
  
  const cryptoKey = key || await generateKey()
  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    cryptoKey,
    fileData
  )
  
  const keyBase64 = await exportKey(cryptoKey)
  const ivBase64 = arrayBufferToBase64(iv)
  
  // Generate SHA-256 checksum of original file
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileData)
  const checksum = arrayBufferToBase64(hashBuffer)
  
  return {
    encryptedBlob: new Blob([encryptedData], { type: 'application/octet-stream' }),
    iv: ivBase64,
    keyBase64,
    checksum,
    originalSize: file.size,
  }
}

/**
 * Decrypt an encrypted file blob
 * Returns decrypted ArrayBuffer
 */
export async function decryptFile(encryptedBlob, keyBase64, ivBase64) {
  const encryptedData = await encryptedBlob.arrayBuffer()
  const key = await importKey(keyBase64)
  const iv = base64ToArrayBuffer(ivBase64)
  
  const decryptedData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encryptedData
  )
  
  return decryptedData
}

/**
 * Download a decrypted file to the user's device
 */
export function downloadDecryptedFile(decryptedBuffer, filename, mimeType) {
  const blob = new Blob([decryptedBuffer], { type: mimeType || 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Utility functions
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function generateRandomKey(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return arrayBufferToBase64(bytes)
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function getFileIcon(mimeType) {
  if (!mimeType) return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📕'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('text')) return '📃'
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html')) return '💻'
  return '📄'
}
