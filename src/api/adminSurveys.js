import apiClient from './client'

export async function fetchAdminSurveys(page = 1, limit = 20) {
  const { data } = await apiClient.get('/admin/surveys', {
    params: { page, limit },
  })
  return data
}

export async function fetchAdminSurvey(surveyId) {
  const { data } = await apiClient.get(`/admin/surveys/${surveyId}`)
  return data
}

export async function createAdminSurvey(payload) {
  const { data } = await apiClient.post('/admin/surveys', payload)
  return data
}

export async function updateAdminSurvey(surveyId, payload) {
  const { data } = await apiClient.patch('/admin/surveys', { id: surveyId, ...payload })
  return data
}

export async function deleteAdminSurvey(surveyId) {
  const { data } = await apiClient.delete(`/admin/surveys/${surveyId}`)
  return data
}
