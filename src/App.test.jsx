import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App, { parseRoute } from './App'
import { flattenTopics } from './components/TopicNavigation'
import { subjects } from './data/subjects'
import { syllabi } from './data/syllabi'

afterEach(() => vi.unstubAllGlobals())

describe('routing and pages', () => {
  it('renders exactly seven linked subject cards', () => {
    window.location.hash = '#/'
    render(<App />)
    expect(screen.getAllByRole('article')).toHaveLength(7)
    for (const subject of subjects) expect(screen.getByRole('link', { name: `Study ${subject.title}` })).toHaveAttribute('href', `#/subjects/${subject.slug}`)
  })

  it('presents the homepage CTA, private status, and syllabus overview', () => {
    window.location.hash = '#/'
    render(<App />)
    expect(screen.getByRole('link', { name: /explore subjects/i })).toHaveAttribute('href', '#subjects')
    expect(screen.getByText(/private by design/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Semester overview')).toHaveTextContent('07')
    expect(screen.getByRole('contentinfo')).toHaveTextContent(/official course syllabi/i)
  })

  it.each(subjects)('resolves $slug to the reusable subject page', (subject) => {
    window.location.hash = `#/subjects/${subject.slug}`
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: subject.title })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Course topics' })).toBeInTheDocument()
  })

  it('routes unknown paths to a helpful page', () => {
    window.location.hash = '#/not-real'
    render(<App />)
    expect(screen.getByRole('heading', { name: /not here/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '#/')
  })

  it('opens and scrolls to the subjects section for the homepage anchor', () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    window.location.hash = '#subjects'
    render(<App />)
    expect(screen.getByRole('heading', { level: 2, name: 'Choose where to begin.' })).toBeInTheDocument()
    expect(scrollIntoView).toHaveBeenCalledOnce()
    delete Element.prototype.scrollIntoView
  })

  it('parses routes independent of the repository base path', () => {
    expect(parseRoute('#/')).toEqual({ page: 'home' })
    expect(parseRoute('#subjects')).toEqual({ page: 'home', anchor: 'subjects' })
    expect(parseRoute('#/subjects/oop')).toEqual({ page: 'subject', slug: 'oop' })
    expect(parseRoute('#/subjects/oop?topic=oop-topic-2')).toEqual({ page: 'subject', slug: 'oop', topic: 'oop-topic-2' })
  })

  it('opens a subject at the top instead of retaining homepage scroll', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    window.location.hash = '#/subjects/oop'
    render(<App />)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' })
  })
})

describe('study interactions', () => {
  it('keeps the mobile lesson primary and closes the course map after selection', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    const scrollIntoView = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    window.location.hash = '#/subjects/digital-logic-design'
    render(<App />)
    const user = userEvent.setup()

    expect(screen.getByRole('heading', { name: 'Introduction' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Course topics' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /browse course map/i }))
    expect(screen.getByRole('navigation', { name: 'Course topics' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Number Systems: Binary, Octal, Hexadecimal' }))

    expect(screen.queryByRole('navigation', { name: 'Course topics' })).not.toBeInTheDocument()
    expect(window.location.hash).toContain('?topic=')
    expect(screen.getByRole('heading', { name: 'Number Systems: Binary, Octal, Hexadecimal' })).toBeInTheDocument()
    expect(scrollIntoView).toHaveBeenCalled()
    delete Element.prototype.scrollIntoView
  })

  it('closes the mobile course map with Escape and restores trigger focus', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    window.location.hash = '#/subjects/oop'
    render(<App />)
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: /browse course map/i })
    await user.click(trigger)
    expect(screen.getByRole('button', { name: 'Close course map' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Course topics' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes the mobile course map from its backdrop', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    window.location.hash = '#/subjects/oop'
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /browse course map/i }))
    await user.click(screen.getByRole('button', { name: 'Dismiss course map' }))
    expect(screen.queryByRole('navigation', { name: 'Course topics' })).not.toBeInTheDocument()
  })

  it('restores the selected lesson from hash history state', () => {
    const topics = flattenTopics(syllabi.oop.units)
    window.location.hash = `#/subjects/oop?topic=${topics[1].id}`
    const view = render(<App />)
    expect(screen.getByRole('heading', { level: 2, name: topics[1].title })).toBeInTheDocument()

    act(() => {
      window.location.hash = `#/subjects/oop?topic=${topics[2].id}`
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { level: 2, name: topics[2].title })).toBeInTheDocument()

    act(() => {
      window.location.hash = `#/subjects/oop?topic=${topics[1].id}`
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { level: 2, name: topics[1].title })).toBeInTheDocument()
    view.unmount()
  })

  it.each([320, 768, 1280])('supports roving keyboard tabs at %ipx', async (width) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    window.location.hash = '#/subjects/oop'
    render(<App />)
    const user = userEvent.setup()
    const notes = screen.getByRole('tab', { name: 'notes' })
    notes.focus()
    await user.keyboard('{ArrowRight}')
    const practice = screen.getByRole('tab', { name: 'practice' })
    expect(practice).toHaveFocus()
    expect(practice).toHaveAttribute('tabindex', '0')
    expect(practice).toHaveAttribute('aria-controls', 'panel-practice')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-practice')
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'quiz' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(notes).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'quiz' })).toHaveFocus()
  })

  it('selects a Digital Logic Design topic and shows its study notes', async () => {
    window.location.hash = '#/subjects/digital-logic-design'
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Number Systems: Binary, Octal, Hexadecimal' }))
    expect(screen.queryByRole('heading', { name: /more study material/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Positional number systems' })).toBeInTheDocument()
  })

  it('renders study notes instead of placeholders for all 16 Expository Writing topics', async () => {
    window.location.hash = '#/subjects/expository-writing'
    render(<App />)
    const user = userEvent.setup()
    const topics = flattenTopics(syllabi['expository-writing'].units)

    expect(topics).toHaveLength(16)
    for (const topic of topics) {
      await user.click(screen.getByRole('button', { name: topic.title }))
      expect(screen.queryByRole('heading', { name: /more study material/i })).not.toBeInTheDocument()
      expect(screen.getByText('Starter notes')).toBeInTheDocument()
    }
  })

  it('reveals practice and scores a quiz locally', async () => {
    window.location.hash = '#/subjects/mathematics-2'
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'practice' }))
    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))
    expect(screen.getByText(/Answer: No; input 1 has two outputs\./)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'quiz' }))
    await user.click(screen.getByLabelText('A function is a relation in which every domain element has exactly one image.'))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(screen.getByRole('status')).toHaveTextContent('Correct · Score 1/1')
  })

  it('keeps static study materials usable when the tutor fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: { code: 'provider_unavailable' } }, { status: 502 })))
    window.location.hash = '#/subjects/mathematics-2'
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Your question'), 'Explain this')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'practice' }))
    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))
    expect(screen.getByText(/Answer: No; input 1 has two outputs\./)).toBeInTheDocument()
  })

  it('covers navigation data for every subject', () => {
    for (const subject of subjects) {
      expect(syllabi[subject.slug].topicCount).toBeGreaterThan(0)
      expect(syllabi[subject.slug].units.length).toBeGreaterThan(0)
    }
  })
})
