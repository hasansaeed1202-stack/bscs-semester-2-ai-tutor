import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App, { parseRoute } from './App'
import { subjects } from './data/subjects'
import { syllabi } from './data/syllabi'

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

  it('parses routes independent of the repository base path', () => {
    expect(parseRoute('#/')).toEqual({ page: 'home' })
    expect(parseRoute('#/subjects/oop')).toEqual({ page: 'subject', slug: 'oop' })
  })
})

describe('study interactions', () => {
  it('selects a topic and shows its coming-soon state', async () => {
    window.location.hash = '#/subjects/digital-logic-design'
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Number Systems: Binary, Octal, Hexadecimal' }))
    expect(screen.getByRole('heading', { name: /more study material/i })).toBeInTheDocument()
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

  it('covers navigation data for every subject', () => {
    for (const subject of subjects) {
      expect(syllabi[subject.slug].topicCount).toBeGreaterThan(0)
      expect(syllabi[subject.slug].units.length).toBeGreaterThan(0)
    }
  })
})
