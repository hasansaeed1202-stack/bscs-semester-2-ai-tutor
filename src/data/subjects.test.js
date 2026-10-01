import { describe, expect, it } from 'vitest'
import { subjects, validateSubjects } from './subjects'

describe('subject catalog', () => {
  it('contains exactly seven complete, unique subjects', () => {
    expect(validateSubjects()).toBe(true)
    expect(subjects).toHaveLength(7)
    expect(new Set(subjects.map((subject) => subject.slug)).size).toBe(7)
    expect(new Set(subjects.map((subject) => subject.source)).size).toBe(7)
  })

  it('rejects missing and duplicate records', () => {
    expect(() => validateSubjects([...subjects.slice(0, 6), subjects[0]])).toThrow(/Duplicate/)
    expect(() => validateSubjects([...subjects.slice(0, 6), { slug: 'x' }])).toThrow(/missing code/)
  })
})
