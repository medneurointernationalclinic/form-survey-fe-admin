import apiClient from './client'

export async function fetchAdminQuestions(surveyId) {
  const { data } = await apiClient.get(`/admin/surveys/${surveyId}/questions`)
  return data
}

export async function fetchAdminQuestion(surveyId, questionId) {
  const { data } = await apiClient.get(`/admin/surveys/${surveyId}/questions/${questionId}`)
  return data
}

export async function createAdminQuestion(surveyId, payload) {
  const { data } = await apiClient.post(`/admin/surveys/${surveyId}/questions`, payload)
  return data
}

export async function updateAdminQuestion(surveyId, questionId, payload) {
  const { data } = await apiClient.patch(`/admin/surveys/${surveyId}/questions/${questionId}`, payload)
  return data
}

export async function deleteAdminQuestion(surveyId, questionId) {
  const { data } = await apiClient.delete(`/admin/surveys/${surveyId}/questions/${questionId}`)
  return data
}
