const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const LIMIT_CONFIG = Object.freeze({
  minute: 'CLIENT_REQUESTS_PER_MINUTE',
  hour: 'CLIENT_REQUESTS_PER_HOUR',
  day: 'CLIENT_REQUESTS_PER_DAY',
  globalRequests: 'GLOBAL_REQUESTS_PER_DAY',
  globalTokens: 'GLOBAL_TOKENS_PER_DAY',
})

export function readLimiterLimits(env) {
  return Object.fromEntries(Object.entries(LIMIT_CONFIG).map(([name, key]) => {
    const raw = env[key]
    const value = typeof raw === 'string' && raw.trim() === '' ? Number.NaN : Number(raw)
    if (raw === undefined || raw === null || !Number.isFinite(value) || value <= 0) {
      throw new TypeError(`${key} must be a finite number greater than zero`)
    }
    return [name, value]
  }))
}

export class TutorLimiter {
  constructor(state, env) {
    this.state = state
    this.limits = Object.freeze(readLimiterLimits(env))
  }

  async fetch(request) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    const { action = 'reserve', clientKey, estimatedTokens = 0 } = await request.json()
    const now = Date.now()
    const limits = this.limits
    const result = await this.state.storage.transaction(async (storage) => {
      const activeKey = `c:${clientKey}:active`
      if (action === 'release') {
        await storage.delete(activeKey)
        return { released: true }
      }
      const bucket = (duration) => Math.floor(now / duration)
      const keys = [`c:${clientKey}:m:${bucket(MINUTE)}`, `c:${clientKey}:h:${bucket(HOUR)}`, `c:${clientKey}:d:${bucket(DAY)}`, `g:r:${bucket(DAY)}`, `g:t:${bucket(DAY)}`]
      const values = await storage.get(keys)
      const counts = keys.map((key) => Number(values.get(key) || 0))
      const activeUntil = Number(await storage.get(activeKey) || 0)
      if (activeUntil > now) return { allowed: false, code: 'rate_limited', retryAfter: Math.max(1, Math.ceil((activeUntil - now) / 1000)) }
      if (counts[0] >= limits.minute || counts[1] >= limits.hour || counts[2] >= limits.day) return { allowed: false, code: 'rate_limited', retryAfter: 60 }
      if (counts[3] >= limits.globalRequests || counts[4] + estimatedTokens > limits.globalTokens) return { allowed: false, code: 'tutor_unavailable' }
      await storage.put(Object.fromEntries(keys.map((key, index) => [key, counts[index] + (index === 4 ? estimatedTokens : 1)])))
      await storage.put(activeKey, now + 25_000)
      return { allowed: true }
    })
    return Response.json(result)
  }
}
