export default function AppShell({ children }) {
  const isTutor = window.location.hash.startsWith('#/subjects/')
  if (isTutor) return <><a className="skip-link" href="#main-content">Skip to main content</a><main id="main-content">{children}</main></>
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#/" aria-label="Semester Two Study Companion home">
            <span className="brand-mark" aria-hidden="true">S2</span>
            <span className="brand-copy">
              <strong>Study Companion</strong>
              <small>BSCS Semester 2</small>
            </span>
          </a>
          <span className="status-badge"><span aria-hidden="true" /><span className="status-label">Private by design</span></span>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>Semester 2 Study Companion</strong>
            <p>Built around the official course syllabi.</p>
          </div>
          <p>Study progress stays in this browser session.</p>
        </div>
      </footer>
    </>
  )
}
