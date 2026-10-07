import { useEffect, useMemo, useRef, useState } from 'react'
import { syllabi } from '../data/syllabi'
import TopicNavigation, { flattenTopics } from '../components/TopicNavigation'
import StudyPanel from '../components/StudyPanel'
import TutorChat from '../components/TutorChat'
import { getSeed } from '../content/studyContent'

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
    setTab(tabNames[next])
    tabRefs.current[next]?.focus()
  }

  useEffect(() => {
    if (topicId && topics.some((topic) => topic.id === topicId)) {
      lessonRef.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' })
    }
  }, [topicId, topics])

  if (!syllabus || !topics.length) return <section className="container empty-page"><h1>Curriculum unavailable</h1><a href="#/">Return home</a></section>
  const activeTopic = topics.find((topic) => topic.id === topicId) ?? topics[0]
  const seed = getSeed(subject.slug, activeTopic.id, topics[0].id)

  function selectTopic(nextTopicId) {
    window.location.hash = `#/subjects/${subject.slug}?topic=${encodeURIComponent(nextTopicId)}`
  }

  return (
    <div className="subject-page">
      <section className={`subject-hero accent-${subject.accent}`}>
        <div className="container">
          <a className="back-link" href="#/">← Course network</a>
          <p className="eyebrow">{subject.code} <span aria-hidden="true">//</span> {syllabus.topicCount} syllabus topics</p>
          <h1>{subject.title}</h1>
          <p>{subject.summary}</p><div className="subject-signal" aria-hidden="true"><span /><span /><span /></div>
        </div>
      </section>
      <div className="container subject-layout">
        <TopicNavigation subjectTitle={subject.title} units={syllabus.units} activeTopicId={activeTopic.id} onSelect={selectTopic} />
        <section className="study-workspace" ref={lessonRef} aria-labelledby="active-topic-heading">
          <p className="eyebrow">Active learning node</p>
          <h2 id="active-topic-heading">{activeTopic.title}</h2>
          <div className="tabs" role="tablist" aria-label="Study resources" aria-orientation="horizontal">
            {tabNames.map((name, index) => (
              <button key={name} id={`tab-${name}`} ref={(node) => { tabRefs.current[index] = node }} role="tab" aria-selected={tab === name} aria-controls={`panel-${name}`} tabIndex={tab === name ? 0 : -1} onClick={() => setTab(name)} onKeyDown={(event) => selectTab(event, index)}>{name}</button>
            ))}
          </div>
          <StudyPanel tab={tab} seed={seed} topicTitle={activeTopic.title} />
        </section>
        <TutorChat subject={subject} activeTopicId={activeTopic.id} />
      </div>
    </div>
  )
}
