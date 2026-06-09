<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchSurveyStats } from '../api/surveys'
import { SURVEY_QUESTIONS } from '../constants/surveyQuestions'
import { isTableQuestion } from '../constants/tableQuestions'
import QuestionChart from '../components/QuestionChart.vue'
import QuestionTable from '../components/QuestionTable.vue'

const loading = ref(false)
const error = ref('')
const totalResponses = ref(0)
const questionsData = ref({})

const questionKeys = computed(() =>
  Array.from({ length: 26 }, (_, i) => `q${i + 1}`),
)

const chartItems = computed(() =>
  questionKeys.value.map((key) => {
    const question = questionsData.value[key]
    return {
      key,
      title: SURVEY_QUESTIONS[key] || key,
      type: question?.type || 'single',
      options: question?.options || [],
      totalResponses: question?.totalResponses ?? 0,
      isTable: isTableQuestion(key),
    }
  }),
)

async function loadStats() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetchSurveyStats()
    if (response.success) {
      totalResponses.value = response.data.totalResponses
      questionsData.value = response.data.questions
    } else {
      error.value = 'Không thể tải thống kê khảo sát'
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi tải thống kê'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadStats())
</script>

<template>
  <div class="chart-page">
    <div class="page-heading">
      <h2>Biểu đồ thống kê</h2>
      <p class="subtitle">Tỉ lệ câu trả lời cho 26 câu hỏi khảo sát</p>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="loading-state">Đang tải biểu đồ...</div>

    <template v-else>
      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Tổng phản hồi</span>
          <span class="stat-value">{{ totalResponses }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Số câu hỏi</span>
          <span class="stat-value">26</span>
        </div>
      </div>

      <div class="chart-grid">
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

.loading-state {
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
