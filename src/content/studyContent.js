const seeds = {
  'digital-logic-design': {
    note: { heading: 'Number systems at a glance', explanation: 'A number system gives symbols a place value. Digital systems commonly use binary, while octal and hexadecimal provide compact ways to write binary patterns.', keyPoints: ['Binary uses base 2: digits 0 and 1.', 'Each position represents a power of the base.', 'Group binary digits in threes for octal and fours for hexadecimal.'], example: '1011₂ = 8 + 2 + 1 = 11₁₀.' },
    practice: { prompt: 'Convert 13₁₀ to binary.', hint: 'Find the powers of two that add to 13.', answer: '1101₂', explanation: '13 = 8 + 4 + 1, so the 8, 4, and 1 positions are set.' },
    quiz: { prompt: 'Which base does hexadecimal use?', choices: ['2', '8', '10', '16'], correctIndex: 3, explanation: 'Hexadecimal has sixteen symbols: 0–9 and A–F.' },
  },
  'discrete-mathematics': {
    note: { heading: 'Thinking in sets', explanation: 'A set is a well-defined collection of distinct objects. Set notation lets us describe, combine, and compare collections precisely.', keyPoints: ['Union contains elements from either set.', 'Intersection contains elements common to both.', 'Difference keeps elements in one set but not the other.'], example: 'If A={1,2} and B={2,3}, then A∩B={2}.' },
    practice: { prompt: 'Let A={1,2,3} and B={3,4}. Find A∪B.', hint: 'Include each distinct element that appears in either set.', answer: '{1,2,3,4}', explanation: 'A union lists every element once.' },
    quiz: { prompt: 'Which symbol denotes set intersection?', choices: ['∪', '∩', '⊂', '∅'], correctIndex: 1, explanation: 'The ∩ symbol represents elements shared by both sets.' },
  },
  'expository-writing': {
    note: { heading: 'Start with purpose and audience', explanation: 'Good writing begins before the first draft. Knowing why you are writing and who will read it guides tone, evidence, detail, and structure.', keyPoints: ['Name the outcome you want from the reader.', 'Consider what the audience already knows.', 'Choose details and tone that fit the situation.'], example: 'A technical guide defines terms for beginners but can use shorthand with specialists.' },
    practice: { prompt: 'Write one purpose statement for an email requesting a deadline extension.', hint: 'State the desired outcome and the reason the reader should consider it.', answer: 'My purpose is to request a two-day extension and explain the documented circumstance affecting my work.', explanation: 'The statement identifies both the action and supporting context.' },
    quiz: { prompt: 'Which choice should audience awareness influence?', choices: ['Only spelling', 'Tone and detail', 'Page color only', 'Nothing in a draft'], correctIndex: 1, explanation: 'Audience affects the tone, context, evidence, and amount of explanation.' },
  },
  'ideology-constitution-pakistan': {
    note: { heading: 'What ideology means', explanation: 'An ideology is an organized set of ideas and values that helps a group interpret society and imagine how it should be ordered.', keyPoints: ['It links beliefs with social or political goals.', 'It can shape collective identity.', 'Historical context influences how an ideology develops.'], example: 'A national ideology can connect shared values to a movement for self-determination.' },
    practice: { prompt: 'In one sentence, distinguish an ideology from a single opinion.', hint: 'Think about scope and organization.', answer: 'An ideology is a connected system of beliefs and values, while an opinion is one individual judgment.', explanation: 'Ideologies organize multiple ideas into a broader worldview.' },
    quiz: { prompt: 'An ideology is best described as:', choices: ['One isolated fact', 'A connected system of ideas and values', 'A list of dates', 'Only a legal document'], correctIndex: 1, explanation: 'Ideology connects beliefs, values, and goals into a coherent outlook.' },
  },
  'mathematics-2': {
    note: { heading: 'Functions connect inputs to outputs', explanation: 'A function assigns exactly one output to every input in its domain. Its domain lists allowed inputs; its range describes resulting outputs.', keyPoints: ['Each domain value has one output.', 'Notation f(x) names the output at x.', 'A graph passes the vertical line test when it represents a function.'], example: 'For f(x)=x², f(3)=9.' },
    practice: { prompt: 'If f(x)=2x+1, find f(4).', hint: 'Substitute 4 wherever x appears.', answer: '9', explanation: 'f(4)=2(4)+1=9.' },
    quiz: { prompt: 'What is the domain of f(x)=1/x over real numbers?', choices: ['All real numbers', 'All real numbers except 0', 'Only positive numbers', 'Only integers'], correctIndex: 1, explanation: 'Division by zero is undefined, so zero is excluded.' },
  },
  oop: {
    note: { heading: 'From structures to objects', explanation: 'Object-oriented problem solving groups state and behavior into objects. A class defines the shared blueprint from which objects are created.', keyPoints: ['State is stored in data members.', 'Behavior is expressed through member functions.', 'Encapsulation keeps related data and operations together.'], example: 'A BankAccount class can hold a balance and expose deposit and withdraw operations.' },
    practice: { prompt: 'Name one likely data member and one member function for a Student class.', hint: 'Choose a fact the object stores and an action it performs.', answer: 'Data member: name; member function: enroll(course).', explanation: 'The data member represents state, while the function represents behavior.' },
    quiz: { prompt: 'A class is primarily:', choices: ['A single variable', 'A blueprint for objects', 'A loop', 'A file format'], correctIndex: 1, explanation: 'A class defines the data and operations shared by its objects.' },
  },
  'probability-and-statistics': {
    note: { heading: 'Data, samples, and populations', explanation: 'A population is the entire group of interest. A sample is the subset observed so that we can describe data and make careful inferences about the population.', keyPoints: ['A parameter describes a population.', 'A statistic describes a sample.', 'Representative sampling reduces systematic bias.'], example: 'Surveying 300 selected students can estimate preferences across the university population.' },
    practice: { prompt: 'A researcher measures 50 of 2,000 devices. Identify the sample.', hint: 'The sample is the group actually observed.', answer: 'The 50 measured devices.', explanation: 'All 2,000 devices form the population; the observed 50 form the sample.' },
    quiz: { prompt: 'Which term describes the complete group under study?', choices: ['Sample', 'Variable', 'Population', 'Statistic'], correctIndex: 2, explanation: 'The population is the full group about which a study wants to draw conclusions.' },
  },
}

export function getSeed(subjectSlug, activeTopicId, firstTopicId) {
  return activeTopicId === firstTopicId ? seeds[subjectSlug] : null
}
