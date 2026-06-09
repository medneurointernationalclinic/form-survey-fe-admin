<script setup>
import { ref, onMounted } from 'vue'
import { fetchSurveys } from '../api/surveys'
import { SURVEY_QUESTIONS } from '../constants/surveyQuestions'

const surveys = ref([])
const PAGE_SIZE = 10
const pagination = ref({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
const loading = ref(false)
const error = ref('')
const expandedId = ref(null)

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('vi-VN')
}

function formatAnswer(value) {
  if (Array.isArray(value)) return value.join(', ')
  return value ?? '—'
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function getQuestionKeys(survey) {
  return Object.keys(survey)
    .filter((key) => key.startsWith('q'))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
}

async function loadSurveys(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const response = await fetchSurveys(page, pagination.value.limit)
    if (response.success) {
      surveys.value = response.data
      pagination.value = response.pagination
    } else {
      error.value = 'Không thể tải dữ liệu khảo sát'
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu'
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) return
  expandedId.value = null
  loadSurveys(page)
}

onMounted(() => loadSurveys())
</script>

<template>
  <div class="dashboard-page">
    <div class="page-heading">
      <h2>Kết quả khảo sát</h2>
      <p class="subtitle">Danh sách phiếu khảo sát từ người dùng</p>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="loading-state">Đang tải dữ liệu...</div>

    <template v-else>
      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Tổng phiếu khảo sát</span>
          <span class="stat-value">{{ pagination.total }}</span>
        </div>
      </div>

      <div v-if="surveys.length === 0" class="empty-state">
        Chưa có phiếu khảo sát nào.
      </div>

      <div v-else class="survey-list">
        <article
          v-for="survey in surveys"
          :key="survey.id"
          class="survey-card"
          :class="{ expanded: expandedId === survey.id }"
        >
          <button class="survey-summary" @click="toggleExpand(survey.id)">
            <div class="survey-info">
              <span class="survey-id">#{{ survey.id }}</span>
              <span class="survey-meta">{{ survey.q1 }} · {{ survey.q2 }} · {{ survey.q3 }}</span>
            </div>
            <div class="survey-right">
              <time>{{ formatDate(survey.created_at) }}</time>
              <span class="chevron">{{ expandedId === survey.id ? '▲' : '▼' }}</span>
            </div>
          </button>

          <div v-if="expandedId === survey.id" class="survey-detail">
            <dl class="answer-list">
              <div v-for="key in getQuestionKeys(survey)" :key="key" class="answer-row">
                <dt>{{ SURVEY_QUESTIONS[key] || key }}</dt>
                <dd>{{ formatAnswer(survey[key]) }}</dd>
              </div>
            </dl>
          </div>
        </article>
      </div>

      <nav v-if="surveys.length > 0" class="pagination">
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
  margin-bottom: 24px;
}

.page-heading h2 {
  font-size: 1.35rem;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 0.9rem;
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
