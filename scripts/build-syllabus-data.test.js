import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseSyllabus } from './build-syllabus-data.mjs'

const sources = [
  ['digital-logic-design', 'digital-logic-design.md'],
  ['discrete-mathematics', 'discrete-mathematics.md'],
  ['expository-writing', 'expository-writing.md'],
  ['ideology-constitution-pakistan', 'ideology-constitution-pakistan.md'],
  ['mathematics-2', 'mathematics-2.md'],
  ['oop', 'oop.md'],
  ['probability-and-statistics', 'probability-and-statistics.md'],
]

describe('syllabus parser', () => {
  it.each(sources)('retains ordered topics for %s', async (slug, filename) => {
    const markdown = await readFile(resolve(filename), 'utf8')
    const result = parseSyllabus(markdown, slug)
    expect(result.topicCount).toBeGreaterThan(0)
    expect(result.units.some((unit) => unit.type === 'week')).toBe(true)
    if (/^###\s+.*(exam|examination)/im.test(markdown)) {
      expect(result.units.some((unit) => unit.type === 'milestone') || result.units.some((unit) => unit.milestones?.length)).toBe(true)
    }
  })

  it('keeps nesting and separates assessments from lessons', () => {
    const result = parseSyllabus('## Week-wise Plan\n\n### Week 1\n- Adders\n  - Half Adder\n- Quiz #01\n\n### Final Examination', 'demo')
    const week = result.units[0]
    expect(week.topics[0].children[0].title).toBe('Half Adder')
    expect(week.assessments).toEqual(['Quiz #01'])
    expect(result.units[1].type).toBe('milestone')
  })
})
