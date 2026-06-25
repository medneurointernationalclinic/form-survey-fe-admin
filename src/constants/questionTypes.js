export function normalizeStatsQuestionType(type) {
  const map = {
    single: 'radio',
    multiple: 'checkbox',
    text: 'text',
    textarea: 'text',
    radio: 'radio',
    checkbox: 'checkbox',
  }
  return map[type] ?? type
}

export function isTableQuestionType(type) {
  const normalized = normalizeStatsQuestionType(type)
  return normalized === 'checkbox' || normalized === 'text'
}
