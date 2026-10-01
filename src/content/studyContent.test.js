import { describe, expect, it } from 'vitest'
import { flattenTopics } from '../components/TopicNavigation'
import { syllabi } from '../data/syllabi'
import { mathematics2Topics } from './mathematics2'
import { oopTopics } from './oop'
import { probabilityAndStatisticsTopics } from './probabilityAndStatistics'
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

describe('Discrete Mathematics study content', () => {
  it('replaces placeholder content for all 67 existing syllabus topics', () => {
    const topics = flattenTopics(syllabi['discrete-mathematics'].units)

    expect(topics).toHaveLength(67)
    for (const topic of topics) {
      const seed = getSeed('discrete-mathematics', topic.id, topics[0].id)
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
      expect(seed.practice).toMatchObject({ prompt: expect.any(String), hint: expect.any(String), answer: expect.any(String), explanation: expect.any(String) })
      expect(seed.quiz.choices).toHaveLength(4)
      expect(seed.quiz.correctIndex).toBeGreaterThanOrEqual(0)
      expect(seed.quiz.correctIndex).toBeLessThan(seed.quiz.choices.length)
      expect(seed.quiz.explanation).toBeTruthy()
    }
  })

  it('does not create content for a topic outside the syllabus', () => {
    expect(getSeed('discrete-mathematics', 'discrete-mathematics-topic-68-invented', 'unused')).toBeNull()
  })

  it('preserves relative-difference operators in runtime content', () => {
    const seed = getSeed('discrete-mathematics', 'discrete-mathematics-topic-7-relative-difference', 'unused')

    expect(seed.note.keyPoints).toContain('Formula/rule: A\\B=A∩Bᶜ; operand order matters.')
    expect(seed.note.example).toContain('A\\B={1,3}')
    expect(seed.practice.prompt).toBe('Find {p,q,r}\\{q,s}.')
  })
})

describe('Mathematics II study content', () => {
  it('provides complete content for all 64 existing syllabus topics', () => {
    const topics = flattenTopics(syllabi['mathematics-2'].units)

    expect(topics).toHaveLength(64)
    expect(Object.keys(mathematics2Topics)).toEqual(topics.map((topic) => topic.id))
    for (const topic of topics) {
      const seed = getSeed('mathematics-2', topic.id, topics[0].id)
      expect(seed, topic.id).not.toBeNull()
      expect(seed.note.heading).toBeTruthy()
      expect(seed.note.explanation).toBeTruthy()
      expect(seed.note.keyPoints).toEqual(expect.arrayContaining([
        expect.stringMatching(/^Definition:/), expect.stringMatching(/^Formula\/rule:/),
        expect.stringMatching(/^Exam focus:/), expect.stringMatching(/^Common mistake:/),
      ]))
      expect(seed.note.example).toBeTruthy()
      expect(seed.practice).toMatchObject({ prompt: expect.any(String), hint: expect.any(String), answer: expect.any(String), explanation: expect.any(String) })
      expect(seed.quiz.choices).toHaveLength(4)
      expect(seed.quiz.correctIndex).toBeGreaterThanOrEqual(0)
      expect(seed.quiz.correctIndex).toBeLessThan(seed.quiz.choices.length)
      expect(seed.quiz.explanation).toBeTruthy()
    }
  })

  it('does not resolve content for an out-of-syllabus topic', () => {
    expect(getSeed('mathematics-2', 'mathematics-2-topic-65-invented', 'unused')).toBeNull()
  })
})

describe('Object Oriented Programming study content', () => {
  it('provides complete content for every OOP syllabus topic', () => {
    const topics = flattenTopics(syllabi.oop.units)
    expect(topics).toHaveLength(47)
    expect(Object.keys(oopTopics)).toEqual(topics.map((topic) => topic.id))
    for (const topic of topics) {
      const seed = getSeed('oop', topic.id, topics[0].id)
      expect(seed, topic.id).not.toBeNull()
      expect(seed.note).toMatchObject({ heading: expect.any(String), explanation: expect.any(String), example: expect.any(String) })
      expect(seed.note.keyPoints).toEqual(expect.arrayContaining([expect.stringMatching(/^Definition:/), expect.stringMatching(/^Exam focus:/), expect.stringMatching(/^Common mistake:/)]))
      expect(seed.practice).toMatchObject({ prompt: expect.any(String), hint: expect.any(String), answer: expect.any(String), explanation: expect.any(String) })
      expect(seed.quiz.choices).toHaveLength(4)
      expect(seed.quiz.correctIndex).toBeGreaterThanOrEqual(0)
      expect(seed.quiz.correctIndex).toBeLessThan(4)
      expect(seed.quiz.explanation).toBeTruthy()
    }
  })

  it('does not resolve an out-of-syllabus OOP topic ID', () => {
    expect(getSeed('oop', 'oop-topic-48-invented', 'unused')).toBeNull()
  })
})

describe('Digital Logic Design study content', () => {
  it('provides complete study content for every existing syllabus topic', () => {
    const topics = flattenTopics(syllabi['digital-logic-design'].units)

    expect(topics).toHaveLength(52)
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
      expect(seed.practice).toMatchObject({ prompt: expect.any(String), hint: expect.any(String), answer: expect.any(String), explanation: expect.any(String) })
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

describe('Ideology & Constitution of Pakistan study content', () => {
  it('provides complete study content for every existing syllabus topic', () => {
    const topics = flattenTopics(syllabi['ideology-constitution-pakistan'].units)

    expect(topics).toHaveLength(62)
    for (const topic of topics) {
      const seed = getSeed('ideology-constitution-pakistan', topic.id, topics[0].id)
      expect(seed, topic.id).not.toBeNull()
      expect(seed.note.heading).toBeTruthy()
      expect(seed.note.explanation).toBeTruthy()
      expect(seed.note.keyPoints).toEqual(expect.arrayContaining([
        expect.stringMatching(/^Definition:/),
        expect.stringMatching(/^Key principle:/),
        expect.stringMatching(/^Exam focus:/),
        expect.stringMatching(/^Common mistake:/),
      ]))
      expect(seed.note.example).toBeTruthy()
      expect(seed.practice).toMatchObject({ prompt: expect.any(String), hint: expect.any(String), answer: expect.any(String), explanation: expect.any(String) })
      expect(seed.quiz.choices).toHaveLength(4)
      expect(seed.quiz.correctIndex).toBeGreaterThanOrEqual(0)
      expect(seed.quiz.correctIndex).toBeLessThan(seed.quiz.choices.length)
      expect(seed.quiz.explanation).toBeTruthy()
    }
  })

  it('does not resolve an out-of-syllabus topic id', () => {
    expect(getSeed('ideology-constitution-pakistan', 'ideology-constitution-pakistan-topic-63-invented', 'unused')).toBeNull()
  })
})

describe('Probability and Statistics study content', () => {
  it('provides complete study content for every existing syllabus topic', () => {
    const topics = flattenTopics(syllabi['probability-and-statistics'].units)

    expect(topics).toHaveLength(47)
    expect(Object.keys(probabilityAndStatisticsTopics)).toEqual(topics.map((topic) => topic.id))
    for (const topic of topics) {
      const seed = getSeed('probability-and-statistics', topic.id, topics[0].id)
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
      expect(seed.practice).toMatchObject({ prompt: expect.any(String), hint: expect.any(String), answer: expect.any(String), explanation: expect.any(String) })
      expect(seed.quiz.choices).toHaveLength(4)
      expect(seed.quiz.correctIndex).toBeGreaterThanOrEqual(0)
      expect(seed.quiz.correctIndex).toBeLessThan(seed.quiz.choices.length)
      expect(seed.quiz.explanation).toBeTruthy()
    }
  })

  it('does not resolve content for an out-of-syllabus topic', () => {
    expect(getSeed('probability-and-statistics', 'probability-and-statistics-topic-48-invented', 'unused')).toBeNull()
  })
})
