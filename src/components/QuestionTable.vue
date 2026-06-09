<script setup>
defineProps({
  questionKey: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, default: 'single' },
  options: { type: Array, default: () => [] },
  totalResponses: { type: Number, default: 0 },
})
</script>

<template>
  <article class="question-chart-card question-table-card">
    <header class="question-chart-header">
      <span class="question-key">{{ questionKey.toUpperCase() }}</span>
      <h3 class="question-title">{{ title }}</h3>
      <div class="question-meta">
        <span class="type-badge table">Bảng thống kê</span>
        <span>{{ totalResponses }} phản hồi</span>
      </div>
    </header>

    <div v-if="options.length === 0" class="chart-empty">Chưa có dữ liệu</div>

    <div v-else class="table-wrapper">
      <table class="stats-table">
        <thead>
          <tr>
            <th>Câu trả lời</th>
            <th class="col-count">SL</th>
            <th class="col-bar">Tỉ lệ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in options" :key="index">
            <td class="cell-answer">{{ item.answer }}</td>
            <td class="cell-count">{{ item.count }}</td>
            <td class="cell-bar">
              <div class="progress-row">
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{ width: `${item.percentage}%` }"
                  />
                </div>
                <span class="progress-label">{{ item.percentage }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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

.type-badge.table {
  background: #ede9fe;
  color: #6d28d9;
}

.chart-empty {
  text-align: center;
  padding: 32px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  background: var(--color-bg);
  border-radius: 8px;
}

.table-wrapper {
  overflow: auto;
  max-height: 360px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.stats-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: left;
  padding: 10px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  box-shadow: 0 1px 0 var(--color-border);
}

.stats-table td {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.stats-table tbody tr:last-child td {
  border-bottom: none;
}

.col-count {
  width: 56px;
  text-align: center;
}

.col-bar {
  width: 200px;
}

.cell-answer {
  line-height: 1.4;
}

.cell-count {
  text-align: center;
  font-weight: 600;
  color: var(--color-text-muted);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: var(--color-bg);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  min-width: 2px;
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary);
  min-width: 44px;
  text-align: right;
}
</style>
