import { subjects } from '../data/subjects'
import SubjectCard from '../components/SubjectCard'

export default function HomePage() {
  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <p className="eyebrow"><span className="live-dot" aria-hidden="true" /> AI-powered learning system <span aria-hidden="true">/</span> Semester 02</p>
            <h1>Build your<br /><span>computing mind.</span></h1>
            <p className="hero-copy">Move through every course with syllabus-led notes, focused practice, and quick knowledge checks—all in one calm workspace.</p>
            <div className="hero-actions">
              <a className="primary-action" href="#subjects">Explore subjects <span aria-hidden="true">↓</span></a>
              <span className="hero-note"><i aria-hidden="true" /> 7 courses connected</span>
            </div>
          </div>
          <div className="hero-panel" aria-label="Semester overview">
            <div className="overview-orbit" aria-hidden="true"><span>ALEXI</span></div>
            <p className="panel-label">Learning core // online</p>
            <div className="semester-stat"><span className="hero-number">07</span><span>curated<br />subjects</span></div>
            <div className="panel-divider" />
            <strong>One connected learning system</strong>
            <small>Notes, practice, quizzes, and an AI tutor grounded in each course.</small>
          </div>
        </div>
      </section>
      <section className="container subjects-section" id="subjects" aria-labelledby="subjects-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Course network // 07 modules</p>
            <h2 id="subjects-heading">Choose where to begin.</h2>
          </div>
          <p>Every course follows its official weekly plan, with focused tools ready for each topic.</p>
        </div>
        <div className="subject-grid">
          {subjects.map((subject, index) => <SubjectCard key={subject.slug} subject={subject} number={index + 1} />)}
        </div>
      </section>
    </div>
  )
}
