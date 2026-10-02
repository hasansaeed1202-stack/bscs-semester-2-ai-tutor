import { useEffect, useState } from 'react'

function EmptyState({ topicTitle }) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state-icon" aria-hidden="true">&#10022;</span>
      <p className="content-kicker">Topic mapped</p>
      <h3>More study material is coming</h3>
      <p>The official topic “{topicTitle}” is in your course map. Starter content for this topic will be added in a future phase.</p>
    </div>
  )
}

function Notes({ note }) {
  return (
    <article className="content-card notes-card">
      <header className="content-card-heading"><span className="content-card-icon notes-icon" aria-hidden="true">N</span><div><p className="content-kicker">Starter notes</p><h3>{note.heading}</h3></div></header>
      <p className="notes-explanation">{note.explanation}</p>
      <section className="key-points" aria-labelledby="key-points-heading"><h4 id="key-points-heading">Key ideas to remember</h4><ul>{note.keyPoints.map((point) => <li key={point}><span aria-hidden="true">&#10003;</span><span>{point}</span></li>)}</ul></section>
      {note.example && <aside className="example"><span className="callout-label">Worked example</span><p>{note.example}</p></aside>}
    </article>
  )
}

function Practice({ item }) {
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  return (
    <article className="content-card practice-card">
      <header className="content-card-heading"><span className="content-card-icon practice-icon" aria-hidden="true">P</span><div><p className="content-kicker">Practice question</p><h3>{item.prompt}</h3></div></header>
      <p className="practice-instruction">Work it through first, then use the hint or compare your answer.</p>
      <div className="button-row practice-actions"><button className="secondary-action" type="button" onClick={() => setShowHint(!showHint)} aria-expanded={showHint} aria-controls="practice-hint">{showHint ? 'Hide hint' : 'Show hint'}</button><button className="primary-action button" type="button" onClick={() => setShowAnswer(!showAnswer)} aria-expanded={showAnswer} aria-controls="practice-answer">{showAnswer ? 'Hide answer' : 'Reveal answer'}</button></div>
      {showHint && <aside id="practice-hint" className="reveal hint-reveal"><span className="callout-label">Hint</span><p>{item.hint}</p></aside>}
      {showAnswer && <aside id="practice-answer" className="reveal answer-reveal"><span className="callout-label">Solution</span><strong>Answer: {item.answer}</strong><p>{item.explanation}</p></aside>}
    </article>
  )
}

function Quiz({ item }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => { setSelected(null); setSubmitted(false) }, [item])
  const correct = selected === item.correctIndex
  const reset = () => { setSelected(null); setSubmitted(false) }
  return (
    <article className="content-card quiz-card">
      <header className="content-card-heading"><span className="content-card-icon quiz-icon" aria-hidden="true">Q</span><div><p className="content-kicker">Knowledge check <span aria-hidden="true">·</span> 1 question</p><h3>{item.prompt}</h3></div></header>
      <fieldset disabled={submitted} aria-describedby={submitted ? 'quiz-result' : undefined}><legend className="visually-hidden">Choose one answer</legend>{item.choices.map((choice, index) => { const choiceState = submitted ? (index === item.correctIndex ? 'correct' : selected === index ? 'incorrect' : '') : ''; return <label className={`quiz-choice ${choiceState}`} key={choice}><input type="radio" name="quiz-choice" aria-label={choice} checked={selected === index} onChange={() => setSelected(index)} /><span className="choice-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span><span className="choice-text">{choice}</span>{choiceState && <span className="choice-result">{choiceState === 'correct' ? 'Correct' : 'Your answer'}</span>}</label> })}</fieldset>
      {!submitted ? <button className="primary-action button quiz-submit" disabled={selected === null} onClick={() => setSubmitted(true)}>Check answer</button> : <div id="quiz-result" className={`quiz-feedback ${correct ? 'correct' : 'incorrect'}`} role="status"><span className="feedback-icon" aria-hidden="true">{correct ? '✓' : '!'}</span><div><strong>{correct ? 'Correct · Score 1/1' : 'Not quite · Score 0/1'}</strong><p>{item.explanation}</p><button className="secondary-action" type="button" onClick={reset}>Try again</button></div></div>}
    </article>
  )
}

export default function StudyPanel({ tab, seed, topicTitle }) {
  let content
  if (!seed) content = <EmptyState topicTitle={topicTitle} />
  else if (tab === 'practice') content = <Practice item={seed.practice} />
  else if (tab === 'quiz') content = <Quiz item={seed.quiz} />
  else content = <Notes note={seed.note} />
  return <div id={`panel-${tab}`} className={`study-panel study-panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex="0">{content}</div>
}
