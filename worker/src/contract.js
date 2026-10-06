import { curricula } from '../curricula/index.js'
import { LIMITS } from './config.js'

const requestFields = new Set(['subjectSlug', 'activeTopicId', 'messages', 'requestId', 'image'])
const messageFields = new Set(['role', 'content'])
const imageFields = new Set(['mimeType', 'data'])
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function validImage(image) {
  if (!image || typeof image !== 'object' || Array.isArray(image) || Object.keys(image).some((key) => !imageFields.has(key))) return false
  if (!imageTypes.has(image.mimeType) || typeof image.data !== 'string') return false
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.data)
  if (!match || match[1] !== image.mimeType) return false
  const encoded = match[2]
  if (encoded.length % 4 !== 0) return false
  let bytes
  try {
    const decoded = atob(encoded)
    bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0))
    if (btoa(decoded) !== encoded) return false
  } catch { return false }
  if (bytes.byteLength < 12 || bytes.byteLength > LIMITS.maxImageBytes) return false
  if (image.mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (image.mimeType === 'image/png') return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)
  return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
}

export function validateRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'body must be an object'
  if (Object.keys(value).some((key) => !requestFields.has(key))) return 'unknown request field'
  if (typeof value.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value.requestId)) return 'requestId must be a UUID'
  const curriculum = curricula[value.subjectSlug]
  if (!curriculum) return 'unknown subjectSlug'
  if (!Array.isArray(value.messages) || value.messages.length < 1 || value.messages.length > LIMITS.maxMessages) return 'invalid messages count'
  let total = 0
  for (const message of value.messages) {
    if (!message || typeof message !== 'object' || Array.isArray(message) || Object.keys(message).some((key) => !messageFields.has(key))) return 'invalid message schema'
    if (!['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > LIMITS.maxMessageCharacters) return 'invalid message'
    total += message.content.length
  }
  if (value.messages.at(-1).role !== 'user' || total > LIMITS.maxTotalCharacters) return 'invalid conversation'
  if (value.activeTopicId != null) {
    if (typeof value.activeTopicId !== 'string') return 'invalid activeTopicId'
    const ids = curriculum.units.flatMap((unit) => (unit.topics || []).flatMap((topic) => [topic.id, ...(topic.children || []).map((child) => child.id)]))
    if (!ids.includes(value.activeTopicId)) return 'unknown activeTopicId'
  }
  if (value.image != null && !validImage(value.image)) return 'invalid image'
  return null
}
