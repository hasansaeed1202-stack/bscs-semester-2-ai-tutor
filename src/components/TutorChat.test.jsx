import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TutorChat, { resetTutorSessions } from './TutorChat'
import { subjects } from '../data/subjects'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); resetTutorSessions() })

describe('TutorChat', () => {
  function streamResponse(...chunks) {
    const encoder = new TextEncoder()
    return new Response(new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
        controller.close()
      },
    }), { headers: { 'content-type': 'text/event-stream' } })
  }

  const answer = (text) => streamResponse(`data: ${JSON.stringify({ response: text })}\n\ndata: [DONE]\n\n`)

  function pendingProvider() {
    return vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
  }

  it('labels the transcript as a live log and describes the input limit', () => {
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    expect(screen.getByRole('log', { name: `${subjects[0].title} tutor conversation` })).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByLabelText('Your question')).toHaveAccessibleDescription('0 of 4000 characters')
  })

  it('uses the configured Tutor Worker URL', async () => {
    vi.stubEnv('VITE_TUTOR_API_URL', 'https://tutor-worker.example/v1/chat')
    const provider = vi.fn(async () => answer('Configured response'))
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
      return answer('<img src=x onerror=alert(1)>')
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
      .mockResolvedValueOnce(answer('Recovered answer'))
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

  it('restores the pending question when the user stops a response', async () => {
    vi.stubGlobal('fetch', pendingProvider())
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Keep this draft')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await user.click(screen.getByRole('button', { name: 'Stop response' }))
    await waitFor(() => expect(screen.getByLabelText('Your question')).toHaveValue('Keep this draft'))
    expect(screen.getByRole('heading', { name: 'What would you like to learn?' })).toBeInTheDocument()
  })

  it('renders one assistant message progressively across arbitrary SSE chunk boundaries', async () => {
    let controller
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new ReadableStream({ start(value) { controller = value } }))))
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Stream this')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByLabelText('Tutor is thinking')).toBeInTheDocument()
    const encoder = new TextEncoder()
    controller.enqueue(encoder.encode('data: {"res'))
    controller.enqueue(encoder.encode('ponse":"Hel"}\r\n\r\ndata: {"response":"lo"}\n\n'))
    expect(await screen.findByText('Hello')).toBeInTheDocument()
    expect(screen.queryByLabelText('Tutor is thinking')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.chat-message.assistant')).toHaveLength(1)
    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
    controller.close()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Stop response' })).not.toBeInTheDocument())
  })

  it('keeps partial text when a streaming response is stopped', async () => {
    let controller
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => new Response(new ReadableStream({
      start(value) {
        controller = value
        options.signal.addEventListener('abort', () => value.error(new DOMException('Aborted', 'AbortError')))
      },
    }))))
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Keep partial')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    controller.enqueue(new TextEncoder().encode('data: {"response":"Partial"}\n\n'))
    expect(await screen.findByText('Partial')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Stop response' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Stop response' })).not.toBeInTheDocument())
    expect(screen.getByText('Partial')).toBeInTheDocument()
    expect(screen.getByLabelText('Your question')).toBeEnabled()
  })

  it('ignores malformed events and flushes a final unterminated event', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => streamResponse('data: not-json\n\ndata: {"response":"Final"}')))
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Finish buffered')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Final')).toBeInTheDocument()
  })

  it('does not restore an in-flight question after clearing chat', async () => {
    vi.stubGlobal('fetch', pendingProvider())
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Discard this question')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await user.click(screen.getByRole('button', { name: 'Clear chat' }))
    await waitFor(() => expect(screen.getByLabelText('Your question')).toHaveValue(''))
    expect(screen.queryByText('Discard this question')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What would you like to learn?' })).toBeInTheDocument()
  })

  it('ignores an aborted request after switching subjects', async () => {
    vi.stubGlobal('fetch', pendingProvider())
    const oop = subjects.find((item) => item.slug === 'oop')
    const math = subjects.find((item) => item.slug === 'mathematics-2')
    const view = render(<TutorChat subject={oop} activeTopicId="oop-topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'OOP pending question')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    view.rerender(<TutorChat subject={math} activeTopicId="math-topic-1" />)
    await waitFor(() => expect(screen.getByLabelText('Your question')).toHaveValue(''))
    expect(screen.queryByText('OOP pending question')).not.toBeInTheDocument()
    expect(screen.getByText('about Mathematics II')).toBeInTheDocument()
  })

  it('keeps conversation history isolated per subject', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer('Subject answer')))
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
    const provider = vi.fn(async () => answer('OK'))
    vi.stubGlobal('fetch', provider)
    render(<TutorChat subject={subject} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Explain this')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('OK')
    expect(JSON.parse(provider.mock.calls[0][1].body)).toMatchObject({ subjectSlug: subject.slug, activeTopicId: 'topic-1', messages: [{ role: 'user', content: 'Explain this' }] })
  })
})
