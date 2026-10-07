export default function SubjectCard({ subject, number }) {
  return (
    <article className={`subject-card accent-${subject.accent}`}>
      <div className="card-top">
        <span className="subject-glyph" aria-hidden="true"><i /><b>{String(number).padStart(2, '0')}</b></span>
        <span className="course-code">{subject.code}</span>
      </div>
      <h3>{subject.title}</h3>
      <p>{subject.summary}</p>
      <div className="card-meta"><span>SYLLABUS</span><span>NOTES</span><span>ALEXI</span></div>
      <a href={`#/subjects/${subject.slug}`} aria-label={`Study ${subject.title}`}>
        <span>Enter course</span><span className="card-arrow" aria-hidden="true">→</span>
      </a>
    </article>
  )
}
