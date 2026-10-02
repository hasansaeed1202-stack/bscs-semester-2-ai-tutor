import { useEffect, useRef, useState } from 'react'

const sessions = new Map()
const emptySession = () => ({ messages: [], draft: '' })

function apiErrorMessage(status, code) {
  if (status === 429) return 'You have reached the tutor limit. Please wait and try again.'
  if (code === 'curriculum_unavailable') return 'The tutor curriculum is unavailable. Your study materials still work.'
  if (status >= 500) return 'The tutor is temporarily unavailable. Your message is preserved for retry.'
  return 'The tutor could not send this message. Check it and try again.'
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
    const request = { controller: new AbortController(), cancelMode: 'stop' }
    activeRequest.current = request
    try {
      const result = await fetch(import.meta.env.VITE_TUTOR_API_URL || '/v1/chat', {
        method: 'POST', signal: request.controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subjectSlug: subject.slug, activeTopicId, messages: outbound, requestId: crypto.randomUUID() }),
      })
      const payload = await result.json().catch(() => ({}))
      if (!result.ok) throw Object.assign(new Error(), { status: result.status, code: payload?.error?.code })
      if (activeRequest.current !== request) return
      activeRequest.current = null
      setMessages((current) => [...current, { role: 'assistant', content: payload.answer }])
      setState('idle')
      requestAnimationFrame(() => latest.current?.focus())
    } catch (cause) {
      if (cause.name === 'AbortError') {
        if (request.cancelMode === 'stop' && activeRequest.current === request) {
          activeRequest.current = null
          setDraft(content)
          setMessages(priorMessages)
          setState('idle')
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
      <div className="transcript" aria-label={`${subject.title} tutor conversation`}>
        {!messages.length && <div className="tutor-empty"><span className="empty-chat-icon" aria-hidden="true">&#10022;</span><h3>What would you like to learn?</h3><p>Ask for a clear explanation, a worked example, a practice problem, or a quick quiz about this course.</p><ul aria-label="Example questions"><li>Explain a difficult concept</li><li>Walk through an example</li><li>Test my understanding</li></ul></div>}
        {messages.map((message, index) => <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span className="message-avatar" aria-hidden="true">{message.role === 'user' ? 'Y' : 'AI'}</span><div><strong>{message.role === 'user' ? 'You' : 'Tutor'}</strong><p>{message.content}</p></div></article>)}
        {state === 'sending' && <div className="tutor-pending" role="status"><span className="message-avatar" aria-hidden="true">AI</span><div><strong>Tutor</strong><span className="thinking-dots" aria-label="Tutor is thinking"><i /><i /><i /></span></div></div>}
        <span id={`latest-${subject.slug}`} ref={latest} tabIndex="-1" />
      </div>
      {error && <div className="tutor-error" role="alert"><span className="error-icon" aria-hidden="true">!</span><div><strong>Message not sent</strong><p>{error}</p><small>Your question is still in the composer. Select “Try again” when you’re ready.</small></div></div>}
      <p className="visually-hidden" aria-live="polite">{state === 'idle' && messages.at(-1)?.role === 'assistant' ? 'Tutor response received.' : ''}</p>
      <form className="tutor-composer" onSubmit={send}>
        <div className="composer-label"><label htmlFor={`tutor-input-${subject.slug}`}>Your question</label><small>about {subject.title}</small></div>
        <div className="composer-field"><textarea id={`tutor-input-${subject.slug}`} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength="4000" rows="3" placeholder="Type your study question…" disabled={state === 'sending'} /><span className="character-count" aria-hidden="true">{draft.length}/4000</span></div>
        <div className="composer-actions"><p>AI can make mistakes. Check important answers.</p><div className="button-row"><button className="primary-action" type="submit" disabled={!draft.trim() || state === 'sending'}>{state === 'error' ? 'Try again' : 'Send'} <span aria-hidden="true">→</span></button>{state === 'sending' && <button className="secondary-action" type="button" onClick={stop}>Stop response</button>}</div></div>
      </form>
    </section>
  )
}

export function resetTutorSessions() { sessions.clear() }
