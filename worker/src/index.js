import { curricula } from '../curricula/index.js'
import { subjects } from './subjects.js'
import { ERROR_STATUS, LIMITS } from './config.js'
import { validateRequest } from './contract.js'
import { buildSystemPrompt } from './prompt.js'
export { TutorLimiter } from './limiter.js'

const encoder = new TextEncoder()
const jsonHeaders = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }

function allowedOrigins(env) {
  return new Set(String(env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean))
}

function response(body, status, requestId, origin, extra = {}) {
  return Response.json({ requestId, ...body }, { status, headers: { ...jsonHeaders, ...extra, ...(origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}) } })
}

function error(code, requestId, origin, detail) {
  return response({ error: { code, message: detail || 'The tutor could not complete this request.' } }, ERROR_STATUS[code], requestId, origin)
}

async function pseudonymousKey(ip, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(ip))
  return [...new Uint8Array(digest)].slice(0, 16).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function callProvider(env, instructions, input, image, signal) {
  const aborted = new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true }))
  const stream = await Promise.race([env.AI.run(image ? env.VISION_MODEL : env.AI_MODEL, {
    messages: [{ role: 'system', content: instructions }, ...input],
    ...(image ? { image: image.data } : {}),
    max_tokens: LIMITS.maxOutputTokens,
    stream: true,
  }), aborted])
  if (!stream || typeof stream.getReader !== 'function') throw Object.assign(new Error('invalid provider response'), { invalidProvider: true })
  return stream
}

function streamingResponse(stream, signal, cleanup, origin) {
  const reader = stream.getReader()
  const aborted = new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true }))
  let cleaned = false
  const finish = async () => {
    if (cleaned) return
    cleaned = true
    await cleanup()
  }
  const body = new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await Promise.race([reader.read(), aborted])
        if (done) {
          controller.close()
          await finish()
        } else controller.enqueue(value)
      } catch (cause) {
        await reader.cancel(cause).catch(() => {})
        controller.error(cause)
        await finish()
      }
    },
    async cancel(reason) {
      await reader.cancel(reason).catch(() => {})
      await finish()
    },
  })
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', 'access-control-allow-origin': origin, 'x-accel-buffering': 'no', vary: 'Origin' } })
}

export default {
  async fetch(request, env) {
    const requestId = crypto.randomUUID()
    const origin = request.headers.get('origin') || ''
    const origins = allowedOrigins(env)
    if (!origins.has(origin)) return error('origin_not_allowed', requestId, null)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'Origin' } })
    if (request.method !== 'POST') return error('method_not_allowed', requestId, origin)
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return error('invalid_request', requestId, origin, 'Content-Type must be application/json.')
    if (Number(request.headers.get('content-length') || 0) > LIMITS.maxBodyBytes) return error('request_too_large', requestId, origin)
    let raw
    try { raw = await request.text() } catch { return error('invalid_request', requestId, origin) }
    if (encoder.encode(raw).byteLength > LIMITS.maxBodyBytes) return error('request_too_large', requestId, origin)
    let body
    try { body = JSON.parse(raw) } catch { return error('invalid_request', requestId, origin, 'Malformed JSON.') }
    const validationError = validateRequest(body)
    if (validationError) return error('invalid_request', body?.requestId || requestId, origin, validationError)
    const effectiveRequestId = body.requestId
    const curriculum = curricula[body.subjectSlug]
    const subject = subjects[body.subjectSlug]
    if (!curriculum?.curriculumVersion || !subject) return error('curriculum_unavailable', effectiveRequestId, origin)
    if (String(env.TUTOR_ENABLED).toLowerCase() !== 'true' || !env.LIMITER || !env.CLIENT_KEY_SECRET || !env.AI?.run || !env.AI_MODEL) return error('tutor_unavailable', effectiveRequestId, origin)
    if (body.image && !env.VISION_MODEL) return error('vision_unavailable', effectiveRequestId, origin, 'Image analysis is not configured.')
    let clientKey
    let stub
    try {
      clientKey = await pseudonymousKey(request.headers.get('cf-connecting-ip') || 'unknown', env.CLIENT_KEY_SECRET)
      stub = env.LIMITER.get(env.LIMITER.idFromName('global'))
      const reserved = await stub.fetch('https://limiter/reserve', { method: 'POST', body: JSON.stringify({ action: 'reserve', clientKey, estimatedTokens: LIMITS.maxOutputTokens }) }).then((item) => item.json())
      if (!reserved.allowed) return response({ error: { code: reserved.code, message: 'The tutor is temporarily unavailable.' } }, ERROR_STATUS[reserved.code], effectiveRequestId, origin, reserved.retryAfter ? { 'retry-after': String(reserved.retryAfter) } : {})
    } catch { return error('tutor_unavailable', effectiveRequestId, origin) }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LIMITS.providerTimeoutMs)
    const cleanup = async () => {
      clearTimeout(timeout)
      try { await stub.fetch('https://limiter/release', { method: 'POST', body: JSON.stringify({ action: 'release', clientKey }) }) } catch { /* lease expires automatically */ }
    }
    try {
      const instructions = buildSystemPrompt(subject, curriculum, body.activeTopicId)
      const stream = await callProvider(env, instructions, body.messages, body.image, controller.signal)
      return streamingResponse(stream, controller.signal, cleanup, origin)
    } catch (cause) {
      await cleanup()
      if (cause.name === 'AbortError') return error('provider_timeout', effectiveRequestId, origin)
      if (cause.invalidProvider) return error('invalid_provider_response', effectiveRequestId, origin)
      return error(cause.providerStatus === 400 ? 'provider_rejected' : 'provider_unavailable', effectiveRequestId, origin)
    }
  },
}
