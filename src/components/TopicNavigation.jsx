export function flattenTopics(units) {
  return units.flatMap((unit) => (unit.topics ?? []).flatMap((topic) => [topic, ...(topic.children ?? [])]))
}

export default function TopicNavigation({ units, activeTopicId, onSelect }) {
  return (
    <nav className="topic-navigation" aria-label="Course topics">
      <div className="topic-nav-heading"><span>Course map</span><small>In syllabus order</small></div>
      {units.map((unit) => unit.type === 'milestone' ? (
        <div className="milestone" key={unit.id}><span aria-hidden="true">◆</span>{unit.title}</div>
      ) : (
        <details key={unit.id} open={unit.topics.some((topic) => topic.id === activeTopicId || topic.children?.some((child) => child.id === activeTopicId))}>
          <summary>{unit.title}<span>{unit.topics.length}</span></summary>
          <div className="week-topics">
            {unit.milestones.map((title) => <div className="milestone compact" key={title}>◆ {title}</div>)}
            {unit.topics.map((topic) => (
              <div key={topic.id}>
                <button className={topic.id === activeTopicId ? 'active' : ''} aria-current={topic.id === activeTopicId ? 'true' : undefined} onClick={() => onSelect(topic.id)}>{topic.title}</button>
                {topic.children?.map((child) => <button className={`child-topic ${child.id === activeTopicId ? 'active' : ''}`} aria-current={child.id === activeTopicId ? 'true' : undefined} key={child.id} onClick={() => onSelect(child.id)}>{child.title}</button>)}
              </div>
            ))}
            {unit.assessments.map((assessment) => <span className="assessment" key={assessment}>{assessment}</span>)}
          </div>
        </details>
      ))}
    </nav>
  )
}
