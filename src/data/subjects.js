export const subjects = Object.freeze([
  { slug: 'digital-logic-design', code: 'EE-223', title: 'Digital Logic Design', summary: 'Build a foundation in number systems, logic circuits, sequential design, and programmable logic.', source: 'digital-logic-design.md', accent: 'coral' },
  { slug: 'discrete-mathematics', code: 'MA-213', title: 'Discrete Mathematics', summary: 'Explore sets, logic, proofs, counting, graphs, trees, and the structures behind computing.', source: 'discrete-mathematics.md', accent: 'violet' },
  { slug: 'expository-writing', code: 'ENG316', title: 'Expository Writing', summary: 'Strengthen purposeful writing, clear organization, revision, presentation, and public speaking.', source: 'expository-writing.md', accent: 'sky' },
  { slug: 'ideology-constitution-pakistan', code: 'GE 109', title: 'Ideology & Constitution of Pakistan', summary: 'Trace Pakistan’s ideological roots, independence movement, constitutions, and political development.', source: 'ideology-constitution-pakistan.md', accent: 'green' },
  { slug: 'mathematics-2', code: 'MATH102', title: 'Mathematics II', summary: 'Study calculus, differential equations, analytical geometry, linear programming, conics, and vectors.', source: 'mathematics-2.md', accent: 'gold' },
  { slug: 'oop', code: 'CS-125T', title: 'Object Oriented Programming', summary: 'Design programs with classes, inheritance, polymorphism, files, templates, and the STL.', source: 'oop.md', accent: 'blue' },
  { slug: 'probability-and-statistics', code: 'MA-313', title: 'Probability and Statistics', summary: 'Reason about data, probability models, estimation, hypothesis tests, and regression.', source: 'probability-and-statistics.md', accent: 'rose' },
])

export function validateSubjects(catalog = subjects) {
  if (!Array.isArray(catalog) || catalog.length !== 7) throw new Error('Subject catalog must contain exactly seven entries.')
  const slugs = new Set()
  const sources = new Set()
  for (const subject of catalog) {
    for (const field of ['slug', 'code', 'title', 'summary', 'source']) {
      if (!subject[field]) throw new Error(`Subject is missing ${field}.`)
    }
    if (slugs.has(subject.slug)) throw new Error(`Duplicate subject slug: ${subject.slug}`)
    if (sources.has(subject.source)) throw new Error(`Duplicate syllabus source: ${subject.source}`)
    slugs.add(subject.slug)
    sources.add(subject.source)
  }
  return true
}

export function getSubject(slug) {
  return subjects.find((subject) => subject.slug === slug)
}

validateSubjects()
