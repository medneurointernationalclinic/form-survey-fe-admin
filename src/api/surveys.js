import apiClient from './client'

export async function fetchSurveys(page = 1, limit = 10) {
  const { data } = await apiClient.get('/surveys', {
    params: { page, limit },
  })
  return data
}

export async function fetchSurveyStats() {
  const { data } = await apiClient.get('/surveys/stats')
  return data
}
