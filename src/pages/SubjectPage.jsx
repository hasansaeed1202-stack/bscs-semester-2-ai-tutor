import { useMemo, useRef, useState } from 'react'
import { syllabi } from '../data/syllabi'
import TopicNavigation, { flattenTopics } from '../components/TopicNavigation'
import StudyPanel from '../components/StudyPanel'
import TutorChat from '../components/TutorChat'
import { getSeed } from '../content/studyContent'

export default function SubjectPage({ subject }) {
  const syllabus = syllabi[subject.slug]
  const topics = useMemo(() => syllabus ? flattenTopics(syllabus.units) : [], [syllabus])
  const [activeTopicId, setActiveTopicId] = useState(topics[0]?.id)
  const [tab, setTab] = useState('notes')
  const tabRefs = useRef([])

  const tabNames = ['notes', 'practice', 'quiz']
  function selectTab(event, index) {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, Home: -index, End: tabNames.length - 1 - index }
    if (!(event.key in offsets)) return
    event.preventDefault()
    const next = (index + offsets[event.key] + tabNames.length) % tabNames.length
    setTab(tabNames[next])
    tabRefs.current[next]?.focus()
  }

  if (!syllabus || !topics.length) return <section className="container empty-page"><h1>Curriculum unavailable</h1><a href="#/">Return home</a></section>
  const activeTopic = topics.find((topic) => topic.id === activeTopicId) ?? topics[0]
  const seed = getSeed(subject.slug, activeTopic.id, topics[0].id)

  return (
    <div className="subject-page">
      <section className={`subject-hero accent-${subject.accent}`}>
        <div className="container">
          <a className="back-link" href="#/">← All subjects</a>
          <p className="eyebrow">{subject.code} · {syllabus.topicCount} syllabus topics</p>
          <h1>{subject.title}</h1>
          <p>{subject.summary}</p>
        </div>
      </section>
      <div className="container subject-layout">
        <TopicNavigation units={syllabus.units} activeTopicId={activeTopic.id} onSelect={setActiveTopicId} />
        <section className="study-workspace" aria-labelledby="active-topic-heading">
          <p className="eyebrow">Current topic</p>
          <h2 id="active-topic-heading">{activeTopic.title}</h2>
          <div className="tabs" role="tablist" aria-label="Study resources">
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
