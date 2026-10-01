import { subjects } from '../data/subjects'
import SubjectCard from '../components/SubjectCard'

export default function HomePage() {
  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">BSCS · Semester 2</p>
            <h1>One clear place to keep your semester moving.</h1>
            <p className="hero-copy">Follow every subject week by week, review concise starter notes, practise core ideas, and check your understanding.</p>
            <a className="primary-action" href="#subjects">Explore subjects <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-panel" aria-label="Semester overview">
            <span className="hero-number">07</span>
            <span>subjects</span>
            <hr />
            <strong>One syllabus-led path</strong>
            <small>No account, tracking, or server required.</small>
          </div>
        </div>
      </section>
      <section className="container subjects-section" id="subjects" aria-labelledby="subjects-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your curriculum</p>
            <h2 id="subjects-heading">Choose a subject</h2>
          </div>
          <p>Seven courses, organized in the same order as the official weekly plans.</p>
        </div>
        <div className="subject-grid">
          {subjects.map((subject, index) => <SubjectCard key={subject.slug} subject={subject} number={index + 1} />)}
        </div>
      </section>
    </div>
  )
}
