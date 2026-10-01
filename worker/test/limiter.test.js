// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TutorLimiter } from '../src/limiter.js'

const validEnv = (changes = {}) => ({ CLIENT_REQUESTS_PER_MINUTE: '2', CLIENT_REQUESTS_PER_HOUR: '3', CLIENT_REQUESTS_PER_DAY: '4', GLOBAL_REQUESTS_PER_DAY: '5', GLOBAL_TOKENS_PER_DAY: '100', ...changes })

function state() {
  const data = new Map()
  let chain = Promise.resolve()
  const storage = {
    get: async (keys) => Array.isArray(keys) ? new Map(keys.map((key) => [key, data.get(key)])) : data.get(keys),
    put: async (key, value) => typeof key === 'object' ? Object.entries(key).forEach(([k, v]) => data.set(k, v)) : data.set(key, value),
    delete: async (key) => data.delete(key),
    transaction: (callback) => { const next = chain.then(() => callback(storage)); chain = next.catch(() => {}); return next },
  }
  return { storage }
}

const reserve = (limiter, clientKey = 'client', estimatedTokens = 10) => limiter.fetch(new Request('https://limiter/reserve', { method: 'POST', body: JSON.stringify({ clientKey, estimatedTokens }) })).then((response) => response.json())
const release = (limiter, clientKey = 'client') => limiter.fetch(new Request('https://limiter/release', { method: 'POST', body: JSON.stringify({ action: 'release', clientKey }) })).then((response) => response.json())

beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1_000_000))

describe('TutorLimiter', () => {
  it.each(['CLIENT_REQUESTS_PER_MINUTE', 'CLIENT_REQUESTS_PER_HOUR', 'CLIENT_REQUESTS_PER_DAY', 'GLOBAL_REQUESTS_PER_DAY', 'GLOBAL_TOKENS_PER_DAY'].flatMap((key) => [
    ['missing', undefined], ['blank', ''], ['malformed', 'nope'], ['non-finite', 'Infinity'], ['zero', '0'], ['negative', '-1'],
  ].map(([label, value]) => [key, label, value])))('rejects %s when it is %s at construction', (key, _label, value) => {
    const env = validEnv()
    if (value === undefined) delete env[key]
    else env[key] = value
    expect(() => new TutorLimiter(state(), env)).toThrow(key)
  })

  it('serializes concurrent reservations and enforces the active lease', async () => {
    const limiter = new TutorLimiter(state(), validEnv())
    const results = await Promise.all([reserve(limiter), reserve(limiter)])
    expect(results.filter((result) => result.allowed)).toHaveLength(1)
    expect(results.find((result) => !result.allowed)).toMatchObject({ code: 'rate_limited', retryAfter: 25 })
  })

  it('enforces global request and token budgets across clients', async () => {
    const requestLimiter = new TutorLimiter(state(), validEnv({ GLOBAL_REQUESTS_PER_DAY: '1' }))
    expect((await reserve(requestLimiter, 'a')).allowed).toBe(true)
    expect((await reserve(requestLimiter, 'b')).code).toBe('tutor_unavailable')
    const tokenLimiter = new TutorLimiter(state(), validEnv({ GLOBAL_TOKENS_PER_DAY: '15' }))
    expect((await reserve(tokenLimiter, 'a', 10)).allowed).toBe(true)
    expect((await reserve(tokenLimiter, 'b', 6)).code).toBe('tutor_unavailable')
  })

  it('releases an active reservation and otherwise lets its lease expire', async () => {
    const limiter = new TutorLimiter(state(), validEnv())
    expect((await reserve(limiter)).allowed).toBe(true)
    expect(await release(limiter)).toEqual({ released: true })
    expect((await reserve(limiter)).allowed).toBe(true)
    Date.now.mockReturnValue(1_026_000)
    expect((await reserve(limiter)).allowed).toBe(true)
  })
})
