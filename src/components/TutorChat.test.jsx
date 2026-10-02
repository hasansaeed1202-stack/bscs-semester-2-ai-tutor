import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TutorChat, { resetTutorSessions } from './TutorChat'
import { subjects } from '../data/subjects'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); resetTutorSessions() })

describe('TutorChat', () => {
  it('uses the configured Tutor Worker URL', async () => {
    vi.stubEnv('VITE_TUTOR_API_URL', 'https://tutor-worker.example/v1/chat')
    const provider = vi.fn(async () => Response.json({ answer: 'Configured response' }))
    vi.stubGlobal('fetch', provider)
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Explain this')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('Configured response')
    expect(provider).toHaveBeenCalledWith('https://tutor-worker.example/v1/chat', expect.any(Object))
  })

  it('sends the selected subject and renders provider text inertly', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
      expect(JSON.parse(options.body)).toMatchObject({ subjectSlug: 'oop', activeTopicId: 'topic-1' })
      return Response.json({ answer: '<img src=x onerror=alert(1)>' })
    }))
    render(<TutorChat subject={subjects.find((item) => item.slug === 'oop')} activeTopicId="topic-1" />)
    const user = userEvent.setup(); await user.type(screen.getByLabelText('Your question'), 'What is a class?'); await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })

  it('restores the draft after a recoverable failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: { code: 'provider_unavailable' } }, { status: 502 })))
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup(); await user.type(screen.getByLabelText('Your question'), 'Please explain this'); await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByLabelText('Your question')).toHaveValue('Please explain this')
  })

  it('retries a preserved question and clears the completed chat', async () => {
    const provider = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: { code: 'provider_unavailable' } }, { status: 502 }))
      .mockResolvedValueOnce(Response.json({ answer: 'Recovered answer' }))
    vi.stubGlobal('fetch', provider)
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Try this question')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Message not sent')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Recovered answer')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear chat' }))
    expect(screen.queryByText('Recovered answer')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What would you like to learn?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear chat' })).toBeDisabled()
  })

  it('keeps conversation history isolated per subject', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ answer: 'Subject answer' })))
    const oop = subjects.find((item) => item.slug === 'oop')
    const math = subjects.find((item) => item.slug === 'mathematics-2')
    const view = render(<TutorChat subject={oop} activeTopicId="oop-topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'OOP only')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Subject answer')).toBeInTheDocument()
    view.rerender(<TutorChat subject={math} activeTopicId="math-topic-1" />)
    expect(screen.queryByText('OOP only')).not.toBeInTheDocument()
    expect(screen.queryByText('Subject answer')).not.toBeInTheDocument()
    view.rerender(<TutorChat subject={oop} activeTopicId="oop-topic-1" />)
    expect(screen.getByText('OOP only')).toBeInTheDocument()
  })

  it.each(subjects)('sends a valid UI payload for $slug', async (subject) => {
    const provider = vi.fn(async () => Response.json({ answer: 'OK' }))
    vi.stubGlobal('fetch', provider)
    render(<TutorChat subject={subject} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Explain this')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('OK')
    expect(JSON.parse(provider.mock.calls[0][1].body)).toMatchObject({ subjectSlug: subject.slug, activeTopicId: 'topic-1', messages: [{ role: 'user', content: 'Explain this' }] })
  })
})
