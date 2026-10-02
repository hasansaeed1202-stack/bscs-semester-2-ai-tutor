import { useEffect, useState } from 'react'
import AppShell from './components/AppShell'
import HomePage from './pages/HomePage'
import SubjectPage from './pages/SubjectPage'
import NotFoundPage from './pages/NotFoundPage'
import { getSubject } from './data/subjects'

export function parseRoute(hash = window.location.hash) {
  const hashValue = hash.replace(/^#/, '') || '/'
  const [path, query = ''] = hashValue.split('?')
  if (path === '/') return { page: 'home' }
  if (path === 'subjects') return { page: 'home', anchor: 'subjects' }
  const match = path.match(/^\/subjects\/([^/]+)\/?$/)
  if (match) {
    const topic = new URLSearchParams(query).get('topic')
    return { page: 'subject', slug: decodeURIComponent(match[1]), ...(topic ? { topic } : {}) }
  }
  return { page: 'not-found' }
}

export default function App() {
  const [route, setRoute] = useState(() => parseRoute())
  useEffect(() => {
    const onChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onChange)
    if (!window.location.hash) window.location.hash = '#/'
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    if (route.page === 'home' && route.anchor) document.getElementById(route.anchor)?.scrollIntoView()
    else if (route.page === 'subject' && !route.topic) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [route])

  let page
  if (route.page === 'home') page = <HomePage />
  else if (route.page === 'subject' && getSubject(route.slug)) page = <SubjectPage subject={getSubject(route.slug)} topicId={route.topic} />
  else page = <NotFoundPage />

  return <AppShell>{page}</AppShell>
}
