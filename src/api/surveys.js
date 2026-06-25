import apiClient from './client'

export async function fetchSurveyResponses(surveyId, page = 1, limit = 20) {
  const { data } = await apiClient.get(`/admin/surveys/${surveyId}/responses`, {
    params: { page, limit },
  })
  return data
}

export async function fetchSurveyResponse(surveyId, responseId) {
  const { data } = await apiClient.get(`/admin/surveys/${surveyId}/responses/${responseId}`)
  return data
}

export async function fetchSurveyStats(surveyId) {
  const { data } = await apiClient.get(`/admin/surveys/${surveyId}/stats`)
  return data
}
