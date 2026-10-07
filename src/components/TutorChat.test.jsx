import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TutorChat, { MAX_IMAGE_BYTES, resetTutorSessions } from './TutorChat'
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

  it('renders educational formatting without interpreting raw HTML and copies source text', async () => {
    const markdown = '## Steps\n\n1. Use **binary**\n2. Run `sum()`\n\n```js\n<img src=x onerror=alert(1)>\n```'
    vi.stubGlobal('fetch', vi.fn(async () => answer(markdown)))
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.type(screen.getByLabelText('Your question'), 'Show steps')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByRole('heading', { name: 'Steps' })).toBeInTheDocument()
    expect(screen.getByText('binary', { selector: 'strong' })).toBeInTheDocument()
    expect(document.querySelector('.answer-content img')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Copy Tutor answer' }))
    expect(writeText).toHaveBeenCalledWith(markdown)
    expect(screen.getByRole('button', { name: 'Copy Tutor answer' })).toHaveTextContent('Copied')
  })

  it('previews and sends a valid image with the grounded request', async () => {
    const provider = vi.fn(async () => answer('Image checked'))
    vi.stubGlobal('fetch', provider)
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], 'work.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('Attach image'), png)
    expect(await screen.findByAltText('Preview of attached student work')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove work.png' }))
    expect(screen.queryByAltText('Preview of attached student work')).not.toBeInTheDocument()
    await user.upload(screen.getByLabelText('Attach image'), png)
    await user.type(screen.getByLabelText('Your question'), 'Where is my mistake?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('Image checked')
    const sent = JSON.parse(provider.mock.calls[0][1].body)
    expect(sent).toMatchObject({ subjectSlug: subjects[0].slug, activeTopicId: 'topic-1', image: { mimeType: 'image/png' } })
    expect(sent.image.data).toMatch(/^data:image\/png;base64,/)
  })

  it('rejects unsupported and oversized image attachments', async () => {
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    fireEvent.change(screen.getByLabelText('Attach image'), { target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] } })
    expect(screen.getByRole('alert')).toHaveTextContent('JPEG, PNG, or WEBP')
    fireEvent.change(screen.getByLabelText('Attach image'), { target: { files: [new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'huge.jpg', { type: 'image/jpeg' })] } })
    expect(screen.getByRole('alert')).toHaveTextContent('3 MB or smaller')
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

  it('accumulates a long multi-chunk answer through normal completion and stops at DONE', async () => {
    const sections = [
      'Probability describes uncertainty. ',
      'For independent events, multiply their probabilities. ',
      'For mutually exclusive events, add their probabilities. ',
      'A worked example reaches the final result of 0.42.',
    ]
    vi.stubGlobal('fetch', vi.fn(async () => streamResponse(
      ...sections.map((response) => `data: ${JSON.stringify({ response })}\n\n`),
      'data: [DONE]\n\ndata: {"response":"ignored after completion"}\n\n',
    )))
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Give me a complete worked explanation')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText(sections.join(''))).toBeInTheDocument()
    expect(screen.queryByText(/ignored after completion/)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps the partial answer and warns when the provider reports its token ceiling', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => streamResponse(
      'data: {"response":"The means of X and Y are"}\n\n',
      'data: {"response":"","finish_reason":"length"}\n\n',
      'data: [DONE]\n\n',
    )))
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Explain the means')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('The means of X and Y are')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Response incomplete')
    expect(screen.getByRole('alert')).toHaveTextContent('reached its response limit')
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
