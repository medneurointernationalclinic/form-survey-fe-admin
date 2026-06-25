<script setup>
import { ref, onMounted } from 'vue'
import { fetchAdminSurveys } from '../api/adminSurveys'
import { fetchAdminQuestions } from '../api/adminQuestions'
import { fetchSurveyResponses, fetchSurveyResponse } from '../api/surveys'

const surveyOptions = ref([])
const selectedSurveyId = ref('')
const responses = ref([])
const questionLabels = ref({})
const PAGE_SIZE = 20
const pagination = ref({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
const loading = ref(false)
const surveysLoading = ref(false)
const error = ref('')
const expandedId = ref(null)
const expandedDetail = ref(null)
const detailLoading = ref(false)

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('vi-VN')
}

function formatAnswer(value) {
  if (Array.isArray(value)) return value.join(', ')
  return value ?? '—'
}

function getAnswerItems(response) {
  const items = response?.answers?.items
  if (Array.isArray(items)) {
    return [...items].sort(
      (a, b) => Number(a.fieldKey.slice(1)) - Number(b.fieldKey.slice(1)),
    )
  }

  return Object.keys(response || {})
    .filter((key) => key.startsWith('q'))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
    .map((key) => ({
      fieldKey: key,
      answer: response[key],
      question: questionLabels.value[key] || key,
    }))
}

function getAnswerLabel(item) {
  return questionLabels.value[item.fieldKey] || item.question || item.fieldKey
}

function getPreviewMeta(response) {
  const previewKeys = ['q1', 'q2', 'q3']
  const items = getAnswerItems(response)
  const parts = previewKeys
    .map((key) => items.find((item) => item.fieldKey === key)?.answer)
    .filter(Boolean)
    .map(formatAnswer)
  return parts.join(' · ') || '—'
}

async function loadSurveyOptions() {
  surveysLoading.value = true
  try {
    const response = await fetchAdminSurveys(1, 100)
    if (response.success) {
      surveyOptions.value = response.data
      if (!selectedSurveyId.value && response.data.length > 0) {
        selectedSurveyId.value = response.data[0].id
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Không thể tải danh sách phiếu'
  } finally {
    surveysLoading.value = false
  }
}

async function loadQuestionLabels() {
  if (!selectedSurveyId.value) return

  try {
    const response = await fetchAdminQuestions(selectedSurveyId.value)
    if (response.success) {
      questionLabels.value = Object.fromEntries(
        response.data.map((q) => [q.fieldKey, q.label]),
      )
    }
  } catch {
    questionLabels.value = {}
  }
}

async function loadResponses(page = 1) {
  if (!selectedSurveyId.value) {
    responses.value = []
    return
  }

  loading.value = true
  error.value = ''
  try {
    const response = await fetchSurveyResponses(
      selectedSurveyId.value,
      page,
      pagination.value.limit,
    )
    if (response.success) {
      responses.value = response.data
      pagination.value = response.pagination
    } else {
      error.value = response.message || 'Không thể tải dữ liệu khảo sát'
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu'
  } finally {
    loading.value = false
  }
}

async function handleSurveyChange() {
  expandedId.value = null
  expandedDetail.value = null
  await Promise.all([loadQuestionLabels(), loadResponses(1)])
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) return
  expandedId.value = null
  expandedDetail.value = null
  loadResponses(page)
}

async function toggleExpand(id) {
  if (expandedId.value === id) {
    expandedId.value = null
    expandedDetail.value = null
    return
  }

  expandedId.value = id
  const fromList = responses.value.find((r) => r.id === id)
  if (fromList?.answers?.items) {
    expandedDetail.value = fromList
    return
  }

  expandedDetail.value = null
  detailLoading.value = true
  try {
    const response = await fetchSurveyResponse(selectedSurveyId.value, id)
    if (response.success) {
      expandedDetail.value = response.data
    } else {
      error.value = response.message || 'Không thể tải chi tiết bài nộp'
      expandedId.value = null
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi tải chi tiết'
    expandedId.value = null
  } finally {
    detailLoading.value = false
  }
}

onMounted(async () => {
  await loadSurveyOptions()
  if (selectedSurveyId.value) {
    await Promise.all([loadQuestionLabels(), loadResponses()])
  }
})
</script>

<template>
  <div class="dashboard-page">
    <div class="page-heading">
      <div>
        <h2>Kết quả khảo sát</h2>
        <p class="subtitle">Danh sách bài nộp theo phiếu khảo sát</p>
      </div>

      <label v-if="surveyOptions.length > 0" class="survey-picker">
        <span>Phiếu khảo sát</span>
        <select
          v-model="selectedSurveyId"
          :disabled="surveysLoading || loading"
          @change="handleSurveyChange"
        >
          <option v-for="survey in surveyOptions" :key="survey.id" :value="survey.id">
            {{ survey.title }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="surveysLoading" class="loading-state">Đang tải danh sách phiếu...</div>

    <div v-else-if="surveyOptions.length === 0" class="empty-state">
      Chưa có phiếu khảo sát nào.
    </div>

    <div v-else-if="loading" class="loading-state">Đang tải dữ liệu...</div>

    <template v-else>
      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Tổng bài nộp</span>
          <span class="stat-value">{{ pagination.total }}</span>
        </div>
      </div>

      <div v-if="responses.length === 0" class="empty-state">
        Chưa có bài nộp nào cho phiếu này.
      </div>

      <div v-else class="survey-list">
        <article
          v-for="response in responses"
          :key="response.id"
          class="survey-card"
          :class="{ expanded: expandedId === response.id }"
        >
          <button class="survey-summary" @click="toggleExpand(response.id)">
            <div class="survey-info">
              <span class="survey-id">#{{ response.id }}</span>
              <span class="survey-meta">{{ getPreviewMeta(response) }}</span>
            </div>
            <div class="survey-right">
              <time>{{ formatDate(response.created_at) }}</time>
              <span class="chevron">{{ expandedId === response.id ? '▲' : '▼' }}</span>
            </div>
          </button>

          <div v-if="expandedId === response.id" class="survey-detail">
            <div v-if="detailLoading" class="detail-loading">Đang tải chi tiết...</div>
            <dl v-else-if="expandedDetail" class="answer-list">
              <div
                v-for="item in getAnswerItems(expandedDetail)"
                :key="item.fieldKey"
                class="answer-row"
              >
                <dt>{{ getAnswerLabel(item) }}</dt>
                <dd>{{ formatAnswer(item.answer) }}</dd>
              </div>
            </dl>
          </div>
        </article>
      </div>

      <nav v-if="responses.length > 0" class="pagination">
        <button
          class="btn-page"
          :disabled="pagination.page <= 1"
          @click="goToPage(pagination.page - 1)"
        >
          ← Trang trước
        </button>
        <span class="page-info">
          Trang {{ pagination.page }} / {{ pagination.totalPages }}
        </span>
        <button
          class="btn-page"
          :disabled="pagination.page >= pagination.totalPages"
          @click="goToPage(pagination.page + 1)"
        >
          Trang sau →
        </button>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.page-heading h2 {
  font-size: 1.35rem;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.survey-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
}

.survey-picker span {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.survey-picker select {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}

.survey-picker select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.alert-error {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid #fecaca;
  margin-bottom: 16px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 48px;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}

.stats-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.survey-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.survey-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.survey-card.expanded {
  box-shadow: var(--shadow);
}

.survey-summary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: transparent;
  text-align: left;
}

.survey-summary:hover {
  background: var(--color-bg);
}

.survey-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.survey-id {
  font-weight: 700;
  color: var(--color-primary);
}

.survey-meta {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.survey-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.survey-right time {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.chevron {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.survey-detail {
  border-top: 1px solid var(--color-border);
  padding: 20px;
  background: #fafbfc;
}

.detail-loading {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  padding: 12px;
}

.answer-list {
  display: grid;
  gap: 12px;
}

.answer-row {
  display: grid;
  grid-template-columns: minmax(180px, 280px) 1fr;
  gap: 8px 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.answer-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.answer-row dt {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.answer-row dd {
  font-size: 0.9rem;
  color: var(--color-text);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.btn-page {
  padding: 8px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
}

.btn-page:hover:not(:disabled) {
  background: var(--color-bg);
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .answer-row {
    grid-template-columns: 1fr;
  }

  .survey-right time {
    display: none;
  }
}
</style>
