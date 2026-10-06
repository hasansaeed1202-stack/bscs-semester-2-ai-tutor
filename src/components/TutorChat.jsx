import { useEffect, useRef, useState } from 'react'

const sessions = new Map()
const emptySession = () => ({ messages: [], draft: '' })

function apiErrorMessage(status, code) {
  if (status === 429) return 'You have reached the tutor limit. Please wait and try again.'
  if (code === 'curriculum_unavailable') return 'The tutor curriculum is unavailable. Your study materials still work.'
  if (status >= 500) return 'The tutor is temporarily unavailable. Your message is preserved for retry.'
  return 'The tutor could not send this message. Check it and try again.'
}

function eventData(event) {
  const lines = event.split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).replace(/^ /, ''))
  return lines.length ? lines.join('\n') : null
}

export default function TutorChat({ subject, activeTopicId }) {
  const initial = sessions.get(subject.slug) || emptySession()
  const [messages, setMessages] = useState(initial.messages)
  const [draft, setDraft] = useState(initial.draft)
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')
  const activeRequest = useRef(null)
  const latest = useRef(null)

  useEffect(() => {
    const request = activeRequest.current
    if (request) {
      request.cancelMode = 'discard'
      activeRequest.current = null
      request.controller.abort()
    }
    const saved = sessions.get(subject.slug) || emptySession()
    setMessages(saved.messages)
    setDraft(saved.draft)
    setState('idle')
    setError('')
  }, [subject.slug])

  useEffect(() => { sessions.set(subject.slug, { messages, draft }) }, [subject.slug, messages, draft])
  useEffect(() => () => {
    const request = activeRequest.current
    if (request) {
      request.cancelMode = 'discard'
      request.controller.abort()
    }
  }, [])

  async function send(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || state === 'sending') return
    const priorMessages = messages.slice(-11)
    const outbound = [...priorMessages, { role: 'user', content }]
    setMessages(outbound)
    setDraft('')
    setError('')
    setState('sending')
    const request = { controller: new AbortController(), cancelMode: 'stop', answer: '' }
    activeRequest.current = request
    try {
      const result = await fetch(import.meta.env.VITE_TUTOR_API_URL || '/v1/chat', {
        method: 'POST', signal: request.controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subjectSlug: subject.slug, activeTopicId, messages: outbound, requestId: crypto.randomUUID() }),
      })
      if (!result.ok) {
        const payload = await result.json().catch(() => ({}))
        throw Object.assign(new Error(), { status: result.status, code: payload?.error?.code })
      }
      if (!result.body) throw new Error('Streaming response unavailable')
      if (activeRequest.current !== request) return

      const reader = result.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finished = false

      const appendEvent = (event) => {
        const data = eventData(event)
        if (data === null) return false
        if (data.trim() === '[DONE]') return true
        try {
          const parsed = JSON.parse(data)
          if (typeof parsed.response !== 'string' || !parsed.response) return false
          request.answer += parsed.response
          setMessages((current) => {
            const last = current.at(-1)
            if (last?.role === 'assistant') return [...current.slice(0, -1), { ...last, content: request.answer }]
            return [...current, { role: 'assistant', content: request.answer }]
          })
        } catch { /* Ignore malformed SSE events without breaking the stream. */ }
        return false
      }

      while (!finished) {
        const { value, done } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })
        const events = buffer.split(/\r?\n\r?\n/)
        buffer = events.pop() || ''
        for (const event of events) {
          if (appendEvent(event)) { finished = true; break }
        }
        if (done) {
          if (buffer) appendEvent(buffer)
          break
        }
      }
      if (finished) await reader.cancel().catch(() => {})
      if (activeRequest.current !== request) return
      activeRequest.current = null
      setState('idle')
      requestAnimationFrame(() => latest.current?.focus())
    } catch (cause) {
      if (cause.name === 'AbortError') {
        if (request.cancelMode === 'stop' && activeRequest.current === request) {
          activeRequest.current = null
          if (!request.answer) {
            setDraft(content)
            setMessages(priorMessages)
          }
          setState('idle')
          requestAnimationFrame(() => latest.current?.focus())
        }
        return
      }
      if (activeRequest.current !== request) return
      activeRequest.current = null
      setDraft(content)
      setMessages(priorMessages)
      setError(apiErrorMessage(cause.status || 0, cause.code))
      setState('error')
    }
  }

  function clear() {
    const request = activeRequest.current
    if (request) {
      request.cancelMode = 'discard'
      activeRequest.current = null
      request.controller.abort()
    }
    setMessages([])
    setDraft('')
    setError('')
    setState('idle')
  }

  function stop() {
    activeRequest.current?.controller.abort()
  }

  return (
    <section className="tutor" aria-labelledby={`tutor-heading-${subject.slug}`}>
      <header className="tutor-heading">
        <div className="tutor-identity"><span className="tutor-avatar" aria-hidden="true">AI</span><div><p className="eyebrow">AI study support <span>·</span> {subject.code}</p><h2 id={`tutor-heading-${subject.slug}`}>Ask the Tutor</h2><p className="tutor-status"><span aria-hidden="true" /> Ready to help with this course</p></div></div>
        <button className="clear-chat" type="button" onClick={clear} disabled={!messages.length && !draft}><span aria-hidden="true">×</span> Clear chat</button>
      </header>
      <p className="tutor-notice"><strong>Study responsibly.</strong> The tutor can make mistakes, so check important answers. Don’t share personal information. This conversation stays in this browser tab.</p>
      {messages.length > 0 && <a className="skip-latest" href={`#latest-${subject.slug}`}>Skip to latest response</a>}
      <div className="transcript" role="log" aria-live="polite" aria-relevant="additions" aria-label={`${subject.title} tutor conversation`}>
        {!messages.length && <div className="tutor-empty"><span className="empty-chat-icon" aria-hidden="true">&#10022;</span><h3>What would you like to learn?</h3><p>Ask for a clear explanation, a worked example, a practice problem, or a quick quiz about this course.</p><ul aria-label="Example questions"><li>Explain a difficult concept</li><li>Walk through an example</li><li>Test my understanding</li></ul></div>}
        {messages.map((message, index) => <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span className="message-avatar" aria-hidden="true">{message.role === 'user' ? 'Y' : 'AI'}</span><div><strong>{message.role === 'user' ? 'You' : 'Tutor'}</strong><p>{message.content}</p></div></article>)}
        {state === 'sending' && messages.at(-1)?.role !== 'assistant' && <div className="tutor-pending" role="status"><span className="message-avatar" aria-hidden="true">AI</span><div><strong>Tutor</strong><span className="thinking-dots" aria-label="Tutor is thinking"><i /><i /><i /></span></div></div>}
        <span id={`latest-${subject.slug}`} ref={latest} tabIndex="-1" />
      </div>
      {error && <div className="tutor-error" role="alert"><span className="error-icon" aria-hidden="true">!</span><div><strong>Message not sent</strong><p>{error}</p><small>Your question is still in the composer. Select “Try again” when you’re ready.</small></div></div>}
      <p className="visually-hidden" aria-live="polite">{state === 'idle' && messages.at(-1)?.role === 'assistant' ? 'Tutor response received.' : ''}</p>
      <form className="tutor-composer" onSubmit={send}>
        <div className="composer-label"><label htmlFor={`tutor-input-${subject.slug}`}>Your question</label><small>about {subject.title}</small></div>
        <div className="composer-field"><textarea id={`tutor-input-${subject.slug}`} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength="4000" rows="3" placeholder="Type your study question…" disabled={state === 'sending'} aria-describedby={`tutor-count-${subject.slug}`} /><span id={`tutor-count-${subject.slug}`} className="character-count">{draft.length} of 4000 characters</span></div>
        <div className="composer-actions"><p>AI can make mistakes. Check important answers.</p><div className="button-row"><button className="primary-action" type="submit" disabled={!draft.trim() || state === 'sending'}>{state === 'error' ? 'Try again' : 'Send'} <span aria-hidden="true">→</span></button>{state === 'sending' && <button className="secondary-action" type="button" onClick={stop}>Stop response</button>}</div></div>
      </form>
    </section>
  )
}

export function resetTutorSessions() { sessions.clear() }
