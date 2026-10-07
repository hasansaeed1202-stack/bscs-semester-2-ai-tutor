export default function NotFoundPage() {
  return (
    <section className="container empty-page">
      <div className="not-found-code" aria-hidden="true">404</div>
      <p className="eyebrow">Route signal lost</p>
      <h1>That study page is not here.</h1>
      <p>The address could not be matched to a subject or study workspace.</p>
      <a className="primary-action" href="#/">Return home</a>
    </section>
  )
}
