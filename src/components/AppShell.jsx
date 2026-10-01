export default function AppShell({ children }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#/" aria-label="Semester Two Study Companion home">
            <span className="brand-mark" aria-hidden="true">S2</span>
            <span>Study Companion</span>
          </a>
          <span className="static-badge">Static · Private by design</span>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="container">Built around the official course syllabi. Study progress stays in this browser session.</div>
      </footer>
    </>
  )
}
