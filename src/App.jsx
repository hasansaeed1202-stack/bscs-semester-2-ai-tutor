import { useEffect, useState } from 'react'
import AppShell from './components/AppShell'
import HomePage from './pages/HomePage'
import SubjectPage from './pages/SubjectPage'
import NotFoundPage from './pages/NotFoundPage'
import { getSubject } from './data/subjects'

export function parseRoute(hash = window.location.hash) {
  const path = hash.replace(/^#/, '').replace(/\?.*$/, '') || '/'
  if (path === '/') return { page: 'home' }
  if (path === 'subjects') return { page: 'home', anchor: 'subjects' }
  const match = path.match(/^\/subjects\/([^/]+)\/?$/)
  if (match) return { page: 'subject', slug: decodeURIComponent(match[1]) }
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
  }, [route])

  let page
  if (route.page === 'home') page = <HomePage />
  else if (route.page === 'subject' && getSubject(route.slug)) page = <SubjectPage subject={getSubject(route.slug)} />
  else page = <NotFoundPage />

  return <AppShell>{page}</AppShell>
}
