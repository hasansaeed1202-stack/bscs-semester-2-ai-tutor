import { subjects } from '../data/subjects'
import SubjectCard from '../components/SubjectCard'

export default function HomePage() {
  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <p className="eyebrow">BSCS <span aria-hidden="true">/</span> Semester 2</p>
            <h1>Your semester,<br /><span>beautifully organized.</span></h1>
            <p className="hero-copy">Move through every course with syllabus-led notes, focused practice, and quick knowledge checks—all in one calm workspace.</p>
            <div className="hero-actions">
              <a className="primary-action" href="#subjects">Explore subjects <span aria-hidden="true">↓</span></a>
              <span className="hero-note">No sign-up. No distractions.</span>
            </div>
          </div>
          <div className="hero-panel" aria-label="Semester overview">
            <div className="overview-orbit" aria-hidden="true"><span>02</span></div>
            <p className="panel-label">Semester overview</p>
            <div className="semester-stat"><span className="hero-number">07</span><span>curated<br />subjects</span></div>
            <div className="panel-divider" />
            <strong>Syllabus-led from start to finish</strong>
            <small>Everything you need to stay oriented and keep making progress.</small>
          </div>
        </div>
      </section>
      <section className="container subjects-section" id="subjects" aria-labelledby="subjects-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your curriculum</p>
            <h2 id="subjects-heading">Choose where to begin.</h2>
          </div>
          <p>Seven courses, thoughtfully organized to match your official weekly plans.</p>
        </div>
        <div className="subject-grid">
          {subjects.map((subject, index) => <SubjectCard key={subject.slug} subject={subject} number={index + 1} />)}
        </div>
      </section>
    </div>
  )
}
