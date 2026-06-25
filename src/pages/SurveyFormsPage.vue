<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  fetchAdminSurveys,
  fetchAdminSurvey,
  createAdminSurvey,
  updateAdminSurvey,
  deleteAdminSurvey,
} from '../api/adminSurveys'

const surveys = ref([])
const PAGE_SIZE = 20
const pagination = ref({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
const loading = ref(false)
const error = ref('')

const showFormModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const formMode = ref('create')
const formLoading = ref(false)
const formError = ref('')
const detailLoading = ref(false)
const detailSurvey = ref(null)
const deleteTarget = ref(null)
const deleteLoading = ref(false)

const emptyForm = () => ({
  title: '',
  slug: '',
  description: '',
  isActive: true,
})

const form = ref(emptyForm())
const editingId = ref(null)

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('vi-VN')
}

async function loadSurveys(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const response = await fetchAdminSurveys(page, pagination.value.limit)
    if (response.success) {
      surveys.value = response.data
      pagination.value = response.pagination
    } else {
      error.value = response.message || 'Không thể tải danh sách phiếu khảo sát'
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu'
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) return
  loadSurveys(page)
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
  showFormModal.value = true
}

function openEditModal(survey) {
  formMode.value = 'edit'
  editingId.value = survey.id
  form.value = {
    title: survey.title,
    slug: survey.slug,
    description: survey.description || '',
    isActive: survey.isActive,
  }
  formError.value = ''
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  formError.value = ''
}

async function openDetailModal(surveyId) {
  showDetailModal.value = true
  detailLoading.value = true
  detailSurvey.value = null
  try {
    const response = await fetchAdminSurvey(surveyId)
    if (response.success) {
      detailSurvey.value = response.data
    } else {
      error.value = response.message || 'Không thể tải chi tiết phiếu khảo sát'
      showDetailModal.value = false
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi tải chi tiết'
    showDetailModal.value = false
  } finally {
    detailLoading.value = false
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  detailSurvey.value = null
}

function openDeleteModal(survey) {
  deleteTarget.value = survey
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteTarget.value = null
}

async function handleSubmitForm() {
  formError.value = ''

  if (!form.value.title.trim()) {
    formError.value = 'Vui lòng nhập tiêu đề'
    return
  }
  if (!form.value.slug.trim()) {
    formError.value = 'Vui lòng nhập slug'
    return
  }

  formLoading.value = true
  try {
    const payload = {
      title: form.value.title.trim(),
      slug: form.value.slug.trim(),
      description: form.value.description.trim(),
      isActive: form.value.isActive,
    }

    const response = formMode.value === 'create'
      ? await createAdminSurvey(payload)
      : await updateAdminSurvey(editingId.value, payload)

    if (response.success) {
      closeFormModal()
      await loadSurveys(pagination.value.page)
    } else {
      formError.value = response.message || 'Thao tác thất bại'
    }
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Thao tác thất bại'
  } finally {
    formLoading.value = false
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return

  deleteLoading.value = true
  try {
    const response = await deleteAdminSurvey(deleteTarget.value.id)
    if (response.success) {
      closeDeleteModal()
      const page = surveys.value.length === 1 && pagination.value.page > 1
        ? pagination.value.page - 1
        : pagination.value.page
      await loadSurveys(page)
    } else {
      error.value = response.message || 'Không thể xóa phiếu khảo sát'
      closeDeleteModal()
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi xóa phiếu khảo sát'
    closeDeleteModal()
  } finally {
    deleteLoading.value = false
  }
}

function copyPublicUrl(url) {
  navigator.clipboard.writeText(url)
}

onMounted(() => loadSurveys())
</script>

<template>
  <div class="survey-forms-page">
    <div class="page-heading">
      <div>
        <h2>Quản lý phiếu khảo sát</h2>
        <p class="subtitle">Tạo, chỉnh sửa và quản lý các phiếu khảo sát</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">+ Tạo phiếu mới</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="loading-state">Đang tải dữ liệu...</div>

    <template v-else>
      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Tổng số phiếu</span>
          <span class="stat-value">{{ pagination.total }}</span>
        </div>
      </div>

      <div v-if="surveys.length === 0" class="empty-state">
        Chưa có phiếu khảo sát nào. Nhấn "Tạo phiếu mới" để bắt đầu.
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Slug</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th class="col-actions">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="survey in surveys" :key="survey.id">
              <td class="cell-title">{{ survey.title }}</td>
              <td><code class="slug">{{ survey.slug }}</code></td>
              <td>
                <span class="badge" :class="survey.isActive ? 'badge-active' : 'badge-inactive'">
                  {{ survey.isActive ? 'Hoạt động' : 'Tắt' }}
                </span>
              </td>
              <td class="cell-date">{{ formatDate(survey.createdAt) }}</td>
              <td class="col-actions">
                <div class="action-buttons">
                  <RouterLink
                    :to="{ name: 'survey-questions', params: { surveyId: survey.id } }"
                    class="btn-action btn-link"
                    title="Quản lý câu hỏi"
                  >
                    Câu hỏi
                  </RouterLink>
                  <button class="btn-action" title="Xem chi tiết" @click="openDetailModal(survey.id)">
                    Xem
                  </button>
                  <button class="btn-action" title="Chỉnh sửa" @click="openEditModal(survey)">
                    Sửa
                  </button>
                  <button class="btn-action btn-danger" title="Xóa" @click="openDeleteModal(survey)">
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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

    <!-- Form modal -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ formMode === 'create' ? 'Tạo phiếu khảo sát' : 'Chỉnh sửa phiếu khảo sát' }}</h3>
          <button class="btn-close" @click="closeFormModal">×</button>
        </div>

        <form class="modal-form" @submit.prevent="handleSubmitForm">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>

          <label class="field">
            <span>Tiêu đề <span class="required">*</span></span>
            <input v-model="form.title" type="text" :disabled="formLoading" placeholder="Khảo sát sau mua" />
          </label>

          <label class="field">
            <span>Slug <span class="required">*</span></span>
            <input v-model="form.slug" type="text" :disabled="formLoading" placeholder="khao-sat-sau-mua" />
          </label>

          <label class="field">
            <span>Mô tả</span>
            <textarea
              v-model="form.description"
              rows="3"
              :disabled="formLoading"
              placeholder="Mô tả phiếu khảo sát..."
            />
          </label>

          <label class="field-checkbox">
            <input v-model="form.isActive" type="checkbox" :disabled="formLoading" />
            <span>Kích hoạt phiếu khảo sát</span>
          </label>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" :disabled="formLoading" @click="closeFormModal">
              Hủy
            </button>
            <button type="submit" class="btn-primary" :disabled="formLoading">
              {{ formLoading ? 'Đang lưu...' : (formMode === 'create' ? 'Tạo phiếu' : 'Lưu thay đổi') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>Chi tiết phiếu khảo sát</h3>
          <button class="btn-close" @click="closeDetailModal">×</button>
        </div>

        <div v-if="detailLoading" class="modal-body loading-state">Đang tải...</div>

        <div v-else-if="detailSurvey" class="modal-body">
          <dl class="detail-list">
            <div class="detail-row">
              <dt>ID</dt>
              <dd>{{ detailSurvey.id }}</dd>
            </div>
            <div class="detail-row">
              <dt>Tiêu đề</dt>
              <dd>{{ detailSurvey.title }}</dd>
            </div>
            <div class="detail-row">
              <dt>Slug</dt>
              <dd><code class="slug">{{ detailSurvey.slug }}</code></dd>
            </div>
            <div class="detail-row">
              <dt>Mô tả</dt>
              <dd>{{ detailSurvey.description || '—' }}</dd>
            </div>
            <div class="detail-row">
              <dt>Trạng thái</dt>
              <dd>
                <span class="badge" :class="detailSurvey.isActive ? 'badge-active' : 'badge-inactive'">
                  {{ detailSurvey.isActive ? 'Hoạt động' : 'Tắt' }}
                </span>
              </dd>
            </div>
            <div v-if="detailSurvey.public_url" class="detail-row">
              <dt>Link công khai</dt>
              <dd class="public-url">
                <a :href="detailSurvey.public_url" target="_blank" rel="noopener noreferrer">
                  {{ detailSurvey.public_url }}
                </a>
                <button type="button" class="btn-copy" @click="copyPublicUrl(detailSurvey.public_url)">
                  Sao chép
                </button>
              </dd>
            </div>
            <div class="detail-row">
              <dt>Ngày tạo</dt>
              <dd>{{ formatDate(detailSurvey.createdAt) }}</dd>
            </div>
            <div class="detail-row">
              <dt>Cập nhật lần cuối</dt>
              <dd>{{ formatDate(detailSurvey.updatedAt) }}</dd>
            </div>
          </dl>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeDetailModal">Đóng</button>
            <button type="button" class="btn-primary" @click="openEditModal(detailSurvey); closeDetailModal()">
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Xác nhận xóa</h3>
          <button class="btn-close" @click="closeDeleteModal">×</button>
        </div>

        <div class="modal-body">
          <p class="delete-message">
            Bạn có chắc muốn xóa phiếu khảo sát
            <strong>"{{ deleteTarget?.title }}"</strong>?
            Hành động này không thể hoàn tác.
          </p>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" :disabled="deleteLoading" @click="closeDeleteModal">
              Hủy
            </button>
            <button type="button" class="btn-danger-solid" :disabled="deleteLoading" @click="handleDelete">
              {{ deleteLoading ? 'Đang xóa...' : 'Xóa phiếu' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
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

.btn-primary {
  padding: 10px 18px;
  background: var(--color-primary);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 18px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-weight: 500;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 16px;
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

.table-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: #fafbfc;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: #fafbfc;
}

.cell-title {
  font-weight: 600;
}

.cell-date {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.slug {
  font-size: 0.85rem;
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: 4px;
}

.col-actions {
  width: 1%;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.btn-action {
  padding: 6px 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.8rem;
  transition: background 0.2s;
}

.btn-action:hover {
  background: var(--color-bg);
}

.btn-action.btn-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.btn-action.btn-danger {
  color: var(--color-error-text);
  border-color: #fecaca;
}

.btn-action.btn-danger:hover {
  background: var(--color-error-bg);
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-active {
  background: #dcfce7;
  color: #166534;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.modal {
  width: 100%;
  max-width: 480px;
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-lg {
  max-width: 560px;
}

.modal-sm {
  max-width: 420px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  font-size: 1.1rem;
}

.btn-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 6px;
  font-size: 1.4rem;
  color: var(--color-text-muted);
  line-height: 1;
}

.btn-close:hover {
  background: var(--color-bg);
}

.modal-form,
.modal-body {
  padding: 24px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-size: 0.875rem;
  font-weight: 600;
}

.required {
  color: var(--color-error-text);
}

.field input,
.field textarea {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.field input:disabled,
.field textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}

.field-checkbox input {
  width: 16px;
  height: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.detail-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px 16px;
}

.detail-row dt {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.detail-row dd {
  font-size: 0.9rem;
}

.public-url {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.public-url a {
  color: var(--color-primary);
  word-break: break-all;
}

.btn-copy {
  padding: 4px 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.75rem;
}

.btn-copy:hover {
  background: var(--color-border);
}

.delete-message {
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 24px;
}

.btn-danger-solid {
  padding: 10px 18px;
  background: #dc2626;
  color: white;
  border-radius: 8px;
  font-weight: 600;
}

.btn-danger-solid:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger-solid:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .page-heading {
    flex-direction: column;
  }

  .detail-row {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
