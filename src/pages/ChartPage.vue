<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchAdminSurveys } from '../api/adminSurveys'
import { fetchSurveyStats } from '../api/surveys'
import { normalizeStatsQuestionType, isTableQuestionType } from '../constants/questionTypes'
import QuestionChart from '../components/QuestionChart.vue'
import QuestionTable from '../components/QuestionTable.vue'

const surveyOptions = ref([])
const selectedSurveyId = ref('')
const loading = ref(false)
const surveysLoading = ref(false)
const error = ref('')
const totalResponses = ref(0)
const questionsData = ref([])

const chartItems = computed(() =>
  questionsData.value
    .filter((question) => question.type !== 'textarea')
    .map((question, index) => {
      const type = normalizeStatsQuestionType(question.type)
      return {
        key: question.fieldKey ?? `q${index + 1}`,
        title: question.question,
        type,
        options: question.options || [],
        totalResponses: question.totalResponses ?? 0,
        isTable: isTableQuestionType(question.type),
      }
    }),
)

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

async function loadStats() {
  if (!selectedSurveyId.value) {
    totalResponses.value = 0
    questionsData.value = []
    return
  }

  loading.value = true
  error.value = ''
  try {
    const response = await fetchSurveyStats(selectedSurveyId.value)
    if (response.success) {
      totalResponses.value = response.data.totalResponses
      questionsData.value = response.data.questions || []
    } else {
      error.value = response.message || 'Không thể tải thống kê khảo sát'
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi tải thống kê'
  } finally {
    loading.value = false
  }
}

async function handleSurveyChange() {
  await loadStats()
}

onMounted(async () => {
  await loadSurveyOptions()
  if (selectedSurveyId.value) {
    await loadStats()
  }
})
</script>

<template>
  <div class="chart-page">
    <div class="page-heading">
      <div>
        <h2>Biểu đồ thống kê</h2>
        <p class="subtitle">Tỉ lệ câu trả lời theo phiếu khảo sát</p>
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

    <div v-else-if="loading" class="loading-state">Đang tải biểu đồ...</div>

    <template v-else>
      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Tổng phản hồi</span>
          <span class="stat-value">{{ totalResponses }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Số câu hỏi</span>
          <span class="stat-value">{{ chartItems.length }}</span>
        </div>
      </div>

      <div v-if="chartItems.length === 0" class="empty-state">
        Chưa có dữ liệu thống kê cho phiếu này.
      </div>

      <div v-else class="chart-grid">
        <template v-for="item in chartItems" :key="item.key">
          <QuestionTable
            v-if="item.isTable"
            :question-key="item.key"
            :title="item.title"
            :type="item.type"
            :options="item.options"
            :total-responses="item.totalResponses"
          />
          <QuestionChart
            v-else
            :question-key="item.key"
            :title="item.title"
            :type="item.type"
            :options="item.options"
            :total-responses="item.totalResponses"
          />
        </template>
      </div>
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

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 20px;
}

@media (max-width: 900px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
