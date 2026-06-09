export const TABLE_QUESTION_KEYS = ['q2', 'q4', 'q18', 'q24']

export function isTableQuestion(key) {
  return TABLE_QUESTION_KEYS.includes(key)
}
