import apiClient from './client'

export async function fetchAdminSections(surveyId) {
  const { data } = await apiClient.get(`/admin/surveys/${surveyId}/sections`)
  return data
}

export async function createAdminSection(surveyId, payload) {
  const { data } = await apiClient.post(`/admin/surveys/${surveyId}/sections`, payload)
  return data
}

export async function updateAdminSection(surveyId, sectionId, payload) {
  const { data } = await apiClient.patch(`/admin/surveys/${surveyId}/sections/${sectionId}`, payload)
  return data
}

export async function deleteAdminSection(surveyId, sectionId) {
  const { data } = await apiClient.delete(`/admin/surveys/${surveyId}/sections/${sectionId}`)
  return data
}

export async function restoreAdminSection(surveyId, sectionId) {
  const { data } = await apiClient.post(`/admin/surveys/${surveyId}/sections/${sectionId}/restore`)
  return data
}
