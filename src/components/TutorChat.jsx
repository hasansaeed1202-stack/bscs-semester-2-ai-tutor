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
  const controller = useRef(null)
  const latest = useRef(null)

  useEffect(() => {
    const saved = sessions.get(subject.slug) || emptySession()
    setMessages(saved.messages)
    setDraft(saved.draft)
    setState('idle')
    setError('')
    controller.current?.abort()
  }, [subject.slug])

  useEffect(() => { sessions.set(subject.slug, { messages, draft }) }, [subject.slug, messages, draft])
  useEffect(() => () => controller.current?.abort(), [])

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
    controller.current = new AbortController()
    try {
      const result = await fetch(import.meta.env.VITE_TUTOR_API_URL || '/v1/chat', {
        method: 'POST', signal: controller.current.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subjectSlug: subject.slug, activeTopicId, messages: outbound, requestId: crypto.randomUUID() }),
      })
      const payload = await result.json().catch(() => ({}))
      if (!result.ok) throw Object.assign(new Error(), { status: result.status, code: payload?.error?.code })
      setMessages((current) => [...current, { role: 'assistant', content: payload.answer }])
      setState('idle')
      requestAnimationFrame(() => latest.current?.focus())
    } catch (cause) {
      if (cause.name === 'AbortError') { setDraft(content); setMessages(priorMessages); setState('idle'); return }
      setDraft(content)
      setMessages(priorMessages)
      setError(apiErrorMessage(cause.status || 0, cause.code))
      setState('error')
    }
  }

  function clear() {
    controller.current?.abort()
    setMessages([])
    setDraft('')
    setError('')
    setState('idle')
  }

  return (
    <section className="tutor" aria-labelledby={`tutor-heading-${subject.slug}`}>
      <div className="tutor-heading">
        <div><p className="eyebrow">AI study support · {subject.code}</p><h2 id={`tutor-heading-${subject.slug}`}>Ask the Tutor</h2></div>
        <button className="secondary-action" type="button" onClick={clear} disabled={!messages.length && !draft}>Clear chat</button>
      </div>
      <p className="tutor-notice">The tutor can make mistakes. Don’t share personal information. Your conversation stays in this browser tab and is not saved by the service.</p>
      <a className="skip-latest" href={`#latest-${subject.slug}`}>Skip to latest response</a>
      <div className="transcript" aria-label={`${subject.title} tutor conversation`}>
        {!messages.length && <p className="tutor-empty">Ask for an explanation, worked example, practice problem, or quiz about this course.</p>}
        {messages.map((message, index) => (
          <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
            <strong>{message.role === 'user' ? 'You' : 'Tutor'}</strong>
            <p>{message.content}</p>
          </article>
        ))}
        <span id={`latest-${subject.slug}`} ref={latest} tabIndex="-1" />
      </div>
      {state === 'sending' && <p className="tutor-pending">Tutor is thinking…</p>}
      {error && <p className="tutor-error" role="alert">{error}</p>}
      <p className="visually-hidden" aria-live="polite">{state === 'idle' && messages.at(-1)?.role === 'assistant' ? 'Tutor response received.' : ''}</p>
      <form className="tutor-composer" onSubmit={send}>
        <label htmlFor={`tutor-input-${subject.slug}`}>Your question</label>
        <textarea id={`tutor-input-${subject.slug}`} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength="4000" rows="3" disabled={state === 'sending'} />
        <div className="button-row">
          <button className="primary-action" type="submit" disabled={!draft.trim() || state === 'sending'}>Send</button>
          {state === 'sending' && <button className="secondary-action" type="button" onClick={() => controller.current?.abort()}>Stop</button>}
        </div>
      </form>
    </section>
  )
}

export function resetTutorSessions() { sessions.clear() }
