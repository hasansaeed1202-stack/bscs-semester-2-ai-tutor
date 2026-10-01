import { describe, expect, it } from 'vitest'
import { flattenTopics } from '../components/TopicNavigation'
import { syllabi } from '../data/syllabi'
import { getSeed } from './studyContent'

describe('Expository Writing study content', () => {
  it('provides complete notes, practice, and answered quizzes for the 16 syllabus topics', () => {
    const topics = flattenTopics(syllabi['expository-writing'].units)

    expect(topics).toHaveLength(16)
    for (const topic of topics) {
      const seed = getSeed('expository-writing', topic.id, topics[0].id)
      expect(seed, topic.id).not.toBeNull()
      expect(seed.note.heading).toBeTruthy()
      expect(seed.note.explanation).toBeTruthy()
      expect(seed.note.keyPoints.length).toBeGreaterThanOrEqual(3)
      expect(seed.note.keyPoints.some((point) => point.startsWith('Definition'))).toBe(true)
      expect(seed.note.keyPoints.some((point) => point.startsWith('Exam focus:'))).toBe(true)
      expect(seed.note.keyPoints.some((point) => point.startsWith('Common mistake:'))).toBe(true)
      expect(seed.note.example).toBeTruthy()
      expect(seed.practice).toMatchObject({ prompt: expect.any(String), hint: expect.any(String), answer: expect.any(String), explanation: expect.any(String) })
      expect(seed.quiz.choices).toHaveLength(4)
      expect(seed.quiz.correctIndex).toBeGreaterThanOrEqual(0)
      expect(seed.quiz.correctIndex).toBeLessThan(seed.quiz.choices.length)
      expect(seed.quiz.explanation).toBeTruthy()
    }
  })
})
