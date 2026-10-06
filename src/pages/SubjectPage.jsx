import { useEffect, useMemo, useRef, useState } from 'react'
import { syllabi } from '../data/syllabi'
import { subjects } from '../data/subjects'
import TopicNavigation, { flattenTopics } from '../components/TopicNavigation'
import StudyPanel from '../components/StudyPanel'
import TutorChat from '../components/TutorChat'
import { getSeed } from '../content/studyContent'

const subjectIcons = ['▦', '◇', '✎', '⌂', '∑', '</>', '▥']

export default function SubjectPage({ subject, topicId }) {
  const syllabus = syllabi[subject.slug]
  const topics = useMemo(() => syllabus ? flattenTopics(syllabus.units) : [], [syllabus])
  const [tab, setTab] = useState('notes')
  const tabRefs = useRef([])
  const lessonRef = useRef(null)
  const tabNames = ['notes', 'practice', 'quiz']
  function selectTab(event, index) {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, Home: -index, End: tabNames.length - 1 - index }
    if (!(event.key in offsets)) return
    event.preventDefault()
    const next = (index + offsets[event.key] + tabNames.length) % tabNames.length
    setTab(tabNames[next]); tabRefs.current[next]?.focus()
  }
  useEffect(() => { if (topicId && topics.some((topic) => topic.id === topicId)) lessonRef.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' }) }, [topicId, topics])
  if (!syllabus || !topics.length) return <section className="container empty-page"><h1>Curriculum unavailable</h1><a href="#/">Return home</a></section>
  const activeTopic = topics.find((topic) => topic.id === topicId) ?? topics[0]
  const seed = getSeed(subject.slug, activeTopic.id, topics[0].id)
  const iconIndex = subjects.findIndex((item) => item.slug === subject.slug)
  const selectTopic = (nextTopicId) => { window.location.hash = `#/subjects/${subject.slug}?topic=${encodeURIComponent(nextTopicId)}` }
  return (
    <div className="tutor-app">
      <aside className="subject-sidebar" aria-label="Semester 2 subjects">
        <a className="tutor-brand" href="#/" aria-label="BSCS Semester 2 AI Tutor home"><span className="brand-cap" aria-hidden="true">◇</span><span><strong>BSCS</strong><small>Semester 2 AI Tutor</small></span></a>
        <p className="sidebar-label">Semester 2 subjects</p>
        <nav className="subject-list">{subjects.map((item, index) => <a key={item.slug} href={`#/subjects/${item.slug}`} className={item.slug === subject.slug ? 'active' : ''} aria-current={item.slug === subject.slug ? 'page' : undefined}><span className={`subject-glyph glyph-${index}`} aria-hidden="true">{subjectIcons[index]}</span><span><strong>{item.title}</strong><small>{item.code}</small></span></a>)}</nav>
        <div className="study-smarter"><span aria-hidden="true">✦</span><div><strong>Study smarter</strong><small>Ask from your Semester 2 syllabus.</small></div></div>
      </aside>
      <div className="tutor-stage">
        <header className="mobile-brand"><a href="#/" className="tutor-brand"><span className="brand-cap" aria-hidden="true">◇</span><span><strong>BSCS</strong><small>Semester 2 AI Tutor</small></span></a></header>
        <div className="subject-header">
          <div className={`subject-title-icon glyph-${iconIndex}`} aria-hidden="true">{subjectIcons[iconIndex]}</div>
          <div><p className="eyebrow">{subject.code} · {syllabus.topicCount} syllabus topics</p><div className="subject-name-line"><h1>{subject.title}</h1><span>({subject.code})</span></div><p>Ask questions, get clear explanations, examples and exam help.</p></div>
          <TopicNavigation subjectTitle={subject.title} units={syllabus.units} activeTopicId={activeTopic.id} onSelect={selectTopic} />
        </div>
        <TutorChat subject={subject} activeTopicId={activeTopic.id} />
        <section className="study-workspace premium-study" ref={lessonRef} aria-labelledby="active-topic-heading">
          <p className="eyebrow">Current topic</p><h2 id="active-topic-heading">{activeTopic.title}</h2>
          <div className="tabs" role="tablist" aria-label="Study resources" aria-orientation="horizontal">{tabNames.map((name, index) => <button key={name} id={`tab-${name}`} ref={(node) => { tabRefs.current[index] = node }} role="tab" aria-selected={tab === name} aria-controls={`panel-${name}`} tabIndex={tab === name ? 0 : -1} onClick={() => setTab(name)} onKeyDown={(event) => selectTab(event, index)}>{name}</button>)}</div>
          <StudyPanel tab={tab} seed={seed} topicTitle={activeTopic.title} />
        </section>
      </div>
    </div>
  )
}
