import { curricula } from '../curricula/index.js'
import { LIMITS } from './config.js'

const requestFields = new Set(['subjectSlug', 'activeTopicId', 'messages', 'requestId'])
const messageFields = new Set(['role', 'content'])

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
  return null
}
