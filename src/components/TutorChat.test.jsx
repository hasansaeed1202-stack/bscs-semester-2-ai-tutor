import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TutorChat, { resetTutorSessions } from './TutorChat'
import { subjects } from '../data/subjects'

afterEach(() => { vi.unstubAllGlobals(); resetTutorSessions() })

describe('TutorChat', () => {
  it('sends the selected subject and renders provider text inertly', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
      expect(JSON.parse(options.body)).toMatchObject({ subjectSlug: 'oop', activeTopicId: 'topic-1' })
      return Response.json({ answer: '<img src=x onerror=alert(1)>' })
    }))
    render(<TutorChat subject={subjects.find((item) => item.slug === 'oop')} activeTopicId="topic-1" />)
    const user = userEvent.setup(); await user.type(screen.getByLabelText('Your question'), 'What is a class?'); await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })

  it('restores the draft after a recoverable failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: { code: 'provider_unavailable' } }, { status: 502 })))
    render(<TutorChat subject={subjects[0]} activeTopicId="topic-1" />)
    const user = userEvent.setup(); await user.type(screen.getByLabelText('Your question'), 'Please explain this'); await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByLabelText('Your question')).toHaveValue('Please explain this')
  })
})
