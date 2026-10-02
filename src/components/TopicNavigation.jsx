import { useEffect, useRef, useState } from 'react'

export function flattenTopics(units) {
  return units.flatMap((unit) => (unit.topics ?? []).flatMap((topic) => [topic, ...(topic.children ?? [])]))
}

export default function TopicNavigation({ units, activeTopicId, onSelect }) {
  const [open, setOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => typeof window.matchMedia !== 'function' || window.matchMedia('(min-width: 960px)').matches)
  const openerRef = useRef(null)
  const drawerRef = useRef(null)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(min-width: 960px)')
    const update = () => {
      setIsDesktop(query.matches)
      if (query.matches) setOpen(false)
    }
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const drawer = drawerRef.current
    drawer?.querySelector('button')?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        openerRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...drawer.querySelectorAll('button, summary')].filter((item) => !item.disabled)
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function closeDrawer({ restoreFocus = true } = {}) {
    setOpen(false)
    if (restoreFocus) requestAnimationFrame(() => openerRef.current?.focus())
  }

  function selectTopic(topicId) {
    closeDrawer({ restoreFocus: false })
    onSelect(topicId)
  }

  return (
    <div className="course-map">
      <button ref={openerRef} className="course-map-trigger" type="button" aria-expanded={open} aria-controls="course-map-navigation" onClick={() => setOpen(true)}>
        <span><small>Current lesson</small>Browse course map</span><span aria-hidden="true">☰</span>
      </button>
      {open && <button className="course-map-backdrop" type="button" tabIndex="-1" aria-label="Dismiss course map" onClick={() => closeDrawer()} />}
      <nav ref={drawerRef} id="course-map-navigation" className={`topic-navigation ${open ? 'is-open' : ''}`} aria-label="Course topics" aria-hidden={!isDesktop && !open} inert={!isDesktop && !open ? true : undefined}>
      <div className="topic-nav-heading"><span>Course map</span><small>In syllabus order</small><button className="course-map-close" type="button" aria-label="Close course map" onClick={() => closeDrawer()}>×</button></div>
      {units.map((unit) => unit.type === 'milestone' ? (
        <div className="milestone" key={unit.id}><span aria-hidden="true">◆</span>{unit.title}</div>
      ) : (
        <details key={unit.id} open={unit.topics.some((topic) => topic.id === activeTopicId || topic.children?.some((child) => child.id === activeTopicId))}>
          <summary>{unit.title}<span>{unit.topics.length}</span></summary>
          <div className="week-topics">
            {unit.milestones.map((title) => <div className="milestone compact" key={title}>◆ {title}</div>)}
            {unit.topics.map((topic) => (
              <div key={topic.id}>
                <button className={topic.id === activeTopicId ? 'active' : ''} aria-current={topic.id === activeTopicId ? 'page' : undefined} onClick={() => selectTopic(topic.id)}>{topic.title}</button>
                {topic.children?.map((child) => <button className={`child-topic ${child.id === activeTopicId ? 'active' : ''}`} aria-current={child.id === activeTopicId ? 'page' : undefined} key={child.id} onClick={() => selectTopic(child.id)}>{child.title}</button>)}
              </div>
            ))}
            {unit.assessments.map((assessment) => <span className="assessment" key={assessment}>{assessment}</span>)}
          </div>
        </details>
      ))}
      </nav>
    </div>
  )
}
