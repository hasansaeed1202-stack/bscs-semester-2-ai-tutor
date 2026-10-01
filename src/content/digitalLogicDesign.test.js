import { describe, expect, it } from 'vitest'
import { flattenTopics } from '../components/TopicNavigation'
import { syllabi } from '../data/syllabi'
import { digitalLogicDesignTopics } from './digitalLogicDesign'
import { getSeed } from './studyContent'

describe('Digital Logic Design study content', () => {
  it('provides complete study content for every existing syllabus topic', () => {
    const topics = flattenTopics(syllabi['digital-logic-design'].units)

    expect(topics).toHaveLength(52)
    expect(Object.keys(digitalLogicDesignTopics)).toEqual(topics.map((topic) => topic.id))
    for (const topic of topics) {
      const seed = getSeed('digital-logic-design', topic.id, topics[0].id)
      expect(seed, topic.id).not.toBeNull()
      expect(seed.note.heading).toBeTruthy()
      expect(seed.note.explanation).toBeTruthy()
      expect(seed.note.keyPoints).toEqual(expect.arrayContaining([
        expect.stringMatching(/^Definition:/),
        expect.stringMatching(/^Formula\/rule:/),
        expect.stringMatching(/^Exam focus:/),
        expect.stringMatching(/^Common mistake:/),
      ]))
      expect(seed.note.example).toBeTruthy()
      expect(seed.practice).toMatchObject({
        prompt: expect.any(String),
        hint: expect.any(String),
        answer: expect.any(String),
        explanation: expect.any(String),
      })
      expect(seed.quiz.choices).toHaveLength(4)
      expect(seed.quiz.correctIndex).toBeGreaterThanOrEqual(0)
      expect(seed.quiz.correctIndex).toBeLessThan(seed.quiz.choices.length)
      expect(seed.quiz.explanation).toBeTruthy()
    }
  })

  it('does not resolve a topic outside the Digital Logic Design syllabus', () => {
    expect(getSeed('digital-logic-design', 'digital-logic-design-topic-53-invented', 'unused')).toBeNull()
  })
})
