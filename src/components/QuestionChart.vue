<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'

const props = defineProps({
  questionKey: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, default: 'radio' },
  options: { type: Array, default: () => [] },
  totalResponses: { type: Number, default: 0 },
})

const CHART_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a',
  '#0891b2', '#ca8a04', '#dc2626', '#4f46e5', '#0d9488',
]

const typeLabels = {
  radio: 'Một lựa chọn',
  checkbox: 'Nhiều lựa chọn',
}

const chartHeight = computed(() => Math.max(220, props.options.length * 52 + 60))

const chartData = computed(() => ({
  labels: props.options.map((item) => item.answer),
  datasets: [
    {
      label: 'Tỉ lệ (%)',
      data: props.options.map((item) => item.percentage),
      counts: props.options.map((item) => item.count),
      backgroundColor: props.options.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
      borderRadius: 6,
      barThickness: 28,
    },
  ],
}))

const chartOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { right: 72 },
  },
  plugins: {
    legend: { display: false },
    datalabels: {
      anchor: 'end',
      align: 'end',
      offset: 4,
      clip: false,
      color: '#1e293b',
      font: { size: 11, weight: '600' },
      formatter: (value) => `${value}%`,
    },
    tooltip: {
      callbacks: {
        title(context) {
          return context[0]?.label ?? ''
        },
        label(context) {
          const count = context.dataset.counts?.[context.dataIndex]
          return count != null
            ? `${context.parsed.x}% (${count} phản hồi)`
            : `${context.parsed.x}%`
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: (value) => `${value}%`,
      },
      grid: { color: '#e2e8f0' },
    },
    y: {
      ticks: { display: false },
      grid: { display: false },
    },
  },
}))
</script>

<template>
  <article class="question-chart-card">
    <header class="question-chart-header">
      <!-- <span class="question-key">{{ questionKey.toUpperCase() }}</span> -->
      <h3 class="question-title">{{ title }}</h3>
      <div class="question-meta">
        <span class="type-badge radio">{{ typeLabels[type] || 'Một lựa chọn' }}</span>
        <span>{{ totalResponses }} phản hồi</span>
      </div>
    </header>

    <div v-if="options.length === 0" class="chart-empty">Chưa có dữ liệu</div>

    <template v-else>
      <div class="chart-wrapper" :style="{ height: `${chartHeight}px` }">
        <Bar :data="chartData" :options="chartOptions" />
      </div>

      <ul class="option-stats">
        <li v-for="(item, index) in options" :key="index" class="option-stat-row">
          <span class="option-stat-color" :style="{ background: CHART_COLORS[index % CHART_COLORS.length] }" />
          <span class="option-stat-label">{{ item.answer }}</span>
          <span class="option-stat-value">{{ item.percentage }}%</span>
        </li>
      </ul>
    </template>
  </article>
</template>

<style scoped>
.question-chart-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 20px;
}

.question-chart-header {
  margin-bottom: 16px;
}

.question-key {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-primary);
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.question-title {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 8px;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-badge.radio {
  background: #f0fdf4;
  color: #15803d;
}

.chart-wrapper {
  position: relative;
  width: 100%;
}

.chart-empty {
  text-align: center;
  padding: 32px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  background: var(--color-bg);
  border-radius: 8px;
}

.option-stats {
  list-style: none;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-stat-row {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: start;
  gap: 10px;
  font-size: 0.82rem;
}

.option-stat-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-top: 4px;
}

.option-stat-label {
  color: var(--color-text);
  line-height: 1.4;
}

.option-stat-value {
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
}
</style>
