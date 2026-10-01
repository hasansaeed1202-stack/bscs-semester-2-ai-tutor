import { render, screen } from '@testing-library/react'
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
    expect(screen.getByRole('heading', { level: 2, name: 'Choose a subject' })).toBeInTheDocument()
    expect(scrollIntoView).toHaveBeenCalledOnce()
    delete Element.prototype.scrollIntoView
  })

  it('parses routes independent of the repository base path', () => {
    expect(parseRoute('#/')).toEqual({ page: 'home' })
    expect(parseRoute('#subjects')).toEqual({ page: 'home', anchor: 'subjects' })
    expect(parseRoute('#/subjects/oop')).toEqual({ page: 'subject', slug: 'oop' })
  })
})

describe('study interactions', () => {
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

  it('selects a topic and shows its coming-soon state', async () => {
    window.location.hash = '#/subjects/digital-logic-design'
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Number Systems: Binary, Octal, Hexadecimal' }))
    expect(screen.getByRole('heading', { name: /more study material/i })).toBeInTheDocument()
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
    expect(screen.getByText(/Answer: 9/)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'quiz' }))
    await user.click(screen.getByLabelText('All real numbers except 0'))
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
    expect(screen.getByText(/Answer: 9/)).toBeInTheDocument()
  })

  it('covers navigation data for every subject', () => {
    for (const subject of subjects) {
      expect(syllabi[subject.slug].topicCount).toBeGreaterThan(0)
      expect(syllabi[subject.slug].units.length).toBeGreaterThan(0)
    }
  })
})
