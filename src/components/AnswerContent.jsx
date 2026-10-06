import { Fragment } from 'react'

function inline(text, keyPrefix) {
  const parts = String(text).split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>
    return <Fragment key={key}>{part}</Fragment>
  })
}

export default function AnswerContent({ content }) {
  const lines = String(content).replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (line.startsWith('```')) {
      const language = line.slice(3).trim()
      const code = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++])
      if (index < lines.length) index += 1
      blocks.push(<pre key={`code-${index}`}><code data-language={language || undefined}>{code.join('\n')}</code></pre>)
      continue
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading) {
      const Tag = `h${Math.min(heading[1].length + 2, 5)}`
      blocks.push(<Tag key={`heading-${index}`}>{inline(heading[2], `heading-${index}`)}</Tag>)
      index += 1
      continue
    }
    const list = /^(\s*)([-*]|\d+\.)\s+(.+)$/.exec(line)
    if (list) {
      const ordered = /\d+\./.test(list[2])
      const items = []
      while (index < lines.length) {
        const item = /^(\s*)([-*]|\d+\.)\s+(.+)$/.exec(lines[index])
        if (!item || /\d+\./.test(item[2]) !== ordered) break
        items.push(<li key={`item-${index}`}>{inline(item[3], `item-${index}`)}</li>)
        index += 1
      }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={`list-${index}`}>{items}</List>)
      continue
    }
    if (!line.trim()) { index += 1; continue }
    const paragraph = [line]
    index += 1
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s|^```|^(\s*)([-*]|\d+\.)\s/.test(lines[index])) paragraph.push(lines[index++])
    blocks.push(<p key={`paragraph-${index}`}>{inline(paragraph.join('\n'), `paragraph-${index}`)}</p>)
  }
  return <div className="answer-content">{blocks}</div>
}
