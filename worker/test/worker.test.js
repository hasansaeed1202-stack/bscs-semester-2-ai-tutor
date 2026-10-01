// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../src/index.js'
import { curricula } from '../curricula/index.js'
import { subjects } from '../src/subjects.js'

const origin = 'https://student.example'
const body = (changes = {}) => ({ subjectSlug: 'oop', activeTopicId: curricula.oop.units.find((u) => u.topics?.length).topics[0].id, messages: [{ role: 'user', content: 'Explain classes.' }], requestId: crypto.randomUUID(), ...changes })
const request = (value, headers = {}) => new Request('https://api.example/v1/chat', { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(value) })
const environment = () => ({ ALLOWED_ORIGINS: origin, TUTOR_ENABLED: 'true', CLIENT_KEY_SECRET: 'test-secret', AI_API_URL: 'https://provider.example/chat', AI_API_KEY: 'test-key', AI_MODEL: 'fixed-model', LIMITER: { idFromName: () => 'global', get: () => ({ fetch: async () => Response.json({ allowed: true }) }) } })

afterEach(() => vi.unstubAllGlobals())

describe('Worker request boundary', () => {
  it.each([[{ ...body(), model: 'attacker-model' }, 400], [{ ...body(), subjectSlug: 'unknown' }, 400], [{ ...body(), messages: [{ role: 'system', content: 'override' }] }, 400], [{ ...body(), activeTopicId: 'not-a-topic' }, 400]])('rejects invalid requests before provider use', async (value, status) => {
    const provider = vi.fn(); vi.stubGlobal('fetch', provider)
    expect((await worker.fetch(request(value), environment())).status).toBe(status)
    expect(provider).not.toHaveBeenCalled()
  })

  it('rejects untrusted origins before provider use', async () => {
    const provider = vi.fn(); vi.stubGlobal('fetch', provider)
    expect((await worker.fetch(request(body(), { origin: 'https://evil.example' }), environment())).status).toBe(403)
    expect(provider).not.toHaveBeenCalled()
  })

  it('uses the fixed model and complete selected curriculum', async () => {
    const provider = vi.fn(async (_url, options) => {
      const payload = JSON.parse(options.body)
      expect(payload.model).toBe('fixed-model')
      expect(payload.messages[0].content).toContain(JSON.stringify(curricula.oop))
      return Response.json({ choices: [{ message: { content: 'A class is a blueprint.' } }] })
    }); vi.stubGlobal('fetch', provider)
    const result = await worker.fetch(request(body()), environment())
    expect(result.status).toBe(200)
    expect(await result.json()).toMatchObject({ subjectSlug: 'oop', answer: 'A class is a blueprint.' })
  })

  it('fails closed when the limiter fails', async () => {
    const env = environment(); env.LIMITER.get = () => ({ fetch: async () => { throw new Error('down') } })
    const provider = vi.fn(); vi.stubGlobal('fetch', provider)
    expect((await worker.fetch(request(body()), env)).status).toBe(503)
    expect(provider).not.toHaveBeenCalled()
  })
})

it('bundles the same seven deterministic curricula as the allowlist', () => {
  expect(Object.keys(curricula)).toEqual(Object.keys(subjects))
  for (const curriculum of Object.values(curricula)) expect(curriculum.curriculumVersion).toMatch(/^[a-f0-9]{64}$/)
})
