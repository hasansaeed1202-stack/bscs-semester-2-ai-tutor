import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import StudyPanel from './StudyPanel'

const seed = {
  note: { heading: 'Useful notes', explanation: 'A concise explanation.', keyPoints: ['First idea', 'Second idea'], example: 'A worked example.' },
  practice: { prompt: 'Solve the problem.', hint: 'Start small.', answer: '42', explanation: 'That is the result.' },
  quiz: { prompt: 'Choose the answer.', choices: ['Wrong', 'Right', 'Also wrong'], correctIndex: 1, explanation: 'Right is correct.' },
}

describe('StudyPanel', () => {
  it('associates the selected panel with its tab and structures notes', () => {
    render(<StudyPanel tab="notes" seed={seed} topicTitle="Topic" />)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-notes')
    expect(screen.getByRole('heading', { name: 'Key ideas to remember' })).toBeInTheDocument()
    expect(screen.getByText('Worked example')).toBeInTheDocument()
  })

  it('exposes independent hint and answer reveals', async () => {
    render(<StudyPanel tab="practice" seed={seed} topicTitle="Topic" />)
    const user = userEvent.setup()
    const hint = screen.getByRole('button', { name: 'Show hint' })
    const answer = screen.getByRole('button', { name: 'Reveal answer' })
    expect(hint).toHaveAttribute('aria-expanded', 'false')
    await user.click(hint)
    expect(hint).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Start small.')).toBeInTheDocument()
    expect(screen.queryByText(/Answer: 42/)).not.toBeInTheDocument()
    await user.click(answer)
    expect(screen.getByText(/Answer: 42/)).toBeInTheDocument()
  })

  it('announces quiz feedback, identifies choices, and resets', async () => {
    render(<StudyPanel tab="quiz" seed={seed} topicTitle="Topic" />)
    const user = userEvent.setup()
    const submit = screen.getByRole('button', { name: 'Check answer' })
    expect(submit).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: /Wrong/ }))
    await user.click(submit)
    expect(screen.getByRole('status')).toHaveTextContent('Not quite · Score 0/1')
    expect(screen.getByText('Your answer')).toBeInTheDocument()
    expect(screen.getByText('Correct')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled()
  })
})
