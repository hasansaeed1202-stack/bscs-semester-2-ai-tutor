import { useEffect, useState } from 'react'

function EmptyState({ topicTitle }) {
  return <div className="empty-state"><span aria-hidden="true">✦</span><h3>More study material is coming</h3><p>The official topic “{topicTitle}” is in your course map. Starter content for this topic will be added in a future phase.</p></div>
}

function Notes({ note }) {
  return <article className="content-card"><p className="content-kicker">Starter notes</p><h3>{note.heading}</h3><p>{note.explanation}</p><h4>Remember</h4><ul>{note.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>{note.example && <div className="example"><strong>Example</strong><p>{note.example}</p></div>}</article>
}

function Practice({ item }) {
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  return <article className="content-card"><p className="content-kicker">Practice question</p><h3>{item.prompt}</h3><div className="button-row"><button className="secondary-action" onClick={() => setShowHint(!showHint)} aria-expanded={showHint}>{showHint ? 'Hide hint' : 'Show hint'}</button><button className="primary-action button" onClick={() => setShowAnswer(!showAnswer)} aria-expanded={showAnswer}>{showAnswer ? 'Hide answer' : 'Reveal answer'}</button></div>{showHint && <div className="reveal"><strong>Hint</strong><p>{item.hint}</p></div>}{showAnswer && <div className="reveal answer"><strong>Answer: {item.answer}</strong><p>{item.explanation}</p></div>}</article>
}

function Quiz({ item }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => { setSelected(null); setSubmitted(false) }, [item])
  const correct = selected === item.correctIndex
  const reset = () => { setSelected(null); setSubmitted(false) }
  return <article className="content-card"><p className="content-kicker">Quick quiz · 1 question</p><h3>{item.prompt}</h3><fieldset disabled={submitted}><legend className="visually-hidden">Choose one answer</legend>{item.choices.map((choice, index) => <label className="quiz-choice" key={choice}><input type="radio" name="quiz-choice" checked={selected === index} onChange={() => setSelected(index)} /> <span>{choice}</span></label>)}</fieldset>{!submitted ? <button className="primary-action button" disabled={selected === null} onClick={() => setSubmitted(true)}>Check answer</button> : <div className={`quiz-feedback ${correct ? 'correct' : 'incorrect'}`} role="status"><strong>{correct ? '✓ Correct · Score 1/1' : '✕ Not quite · Score 0/1'}</strong><p>{item.explanation}</p><button className="secondary-action" onClick={reset}>Try again</button></div>}</article>
}

export default function StudyPanel({ tab, seed, topicTitle }) {
  let content
  if (!seed) content = <EmptyState topicTitle={topicTitle} />
  else if (tab === 'practice') content = <Practice item={seed.practice} />
  else if (tab === 'quiz') content = <Quiz item={seed.quiz} />
  else content = <Notes note={seed.note} />
  return <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex="0">{content}</div>
}
