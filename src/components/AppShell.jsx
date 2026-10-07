export default function AppShell({ children }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#/" aria-label="BSCS Semester 2 AI Study Companion home">
            <span className="brand-mark" aria-hidden="true"><i /><b>AI</b></span>
            <span className="brand-copy">
              <strong>BSCS Semester 2</strong>
              <small>AI Study Companion</small>
            </span>
          </a>
          <span className="status-badge"><span aria-hidden="true" /><span className="status-label">Private by design</span></span>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>BSCS Semester 2 <span className="footer-signal">//</span> ALEXI</strong>
            <p>AI-supported learning, grounded in your official course syllabi.</p>
          </div>
          <p>Study progress stays in this browser session.</p>
        </div>
      </footer>
    </>
  )
}
