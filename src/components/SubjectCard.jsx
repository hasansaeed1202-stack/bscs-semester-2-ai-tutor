export default function SubjectCard({ subject, number }) {
  return (
    <article className={`subject-card accent-${subject.accent}`}>
      <div className="card-top">
        <span className="card-number">{String(number).padStart(2, '0')}</span>
        <span className="course-code">{subject.code}</span>
      </div>
      <h3>{subject.title}</h3>
      <p>{subject.summary}</p>
      <a href={`#/subjects/${subject.slug}`} aria-label={`Study ${subject.title}`}>
        <span>Open subject</span><span className="card-arrow" aria-hidden="true">→</span>
      </a>
    </article>
  )
}
