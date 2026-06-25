<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { fetchAdminSurvey } from '../api/adminSurveys'
import {
  fetchAdminQuestions,
  fetchAdminQuestion,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
} from '../api/adminQuestions'
import {
  fetchAdminSections,
  createAdminSection,
  updateAdminSection,
  deleteAdminSection,
  restoreAdminSection,
} from '../api/adminSections'

const route = useRoute()
const surveyId = computed(() => route.params.surveyId)

const survey = ref(null)
const sections = ref([])
const questions = ref([])
const loading = ref(false)
const error = ref('')

const showFormModal = ref(false)
const showDetailModal = ref(false)
const showToggleActiveModal = ref(false)
const formMode = ref('create')
const formLoading = ref(false)
const formError = ref('')
const detailLoading = ref(false)
const detailQuestion = ref(null)
const toggleActiveTarget = ref(null)
const toggleActiveLoading = ref(false)
const editingId = ref(null)

const showSectionFormModal = ref(false)
const showSectionToggleActiveModal = ref(false)
const sectionFormMode = ref('create')
const sectionFormLoading = ref(false)
const sectionFormError = ref('')
const editingSectionId = ref(null)
const sectionToggleActiveTarget = ref(null)
const sectionToggleActiveLoading = ref(false)

const QUESTION_TYPES = [
  { value: 'single', label: 'Chọn một' },
  { value: 'multiple', label: 'Chọn nhiều' },
  { value: 'text', label: 'Văn bản' },
]

const emptyMetadata = () => ({
  hasOther: false,
  otherPlaceholder: '',
  hint: '',
  maxSelect: '',
  placeholder: '',
})

const emptyForm = () => ({
  label: '',
  type: 'single',
  options: [''],
  isRequired: true,
  sectionId: '',
  metadata: emptyMetadata(),
})

const form = ref(emptyForm())

const emptySectionForm = () => ({
  title: '',
})

const sectionForm = ref(emptySectionForm())

const groupedQuestions = computed(() =>
  sections.value.map((section) => ({
    section,
    title: section.title,
    questions: questions.value
      .filter((q) => String(q.sectionId) === String(section.id))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  })),
)

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('vi-VN')
}

function typeLabel(type) {
  return QUESTION_TYPES.find((t) => t.value === type)?.label || type
}

function formatMetadata(metadata) {
  if (!metadata) return '—'
  const parts = []
  if (metadata.hint) parts.push(metadata.hint)
  if (metadata.maxSelect) parts.push(`Tối đa ${metadata.maxSelect}`)
  if (metadata.hasOther) parts.push('Có "Khác"')
  if (metadata.placeholder) parts.push(`Placeholder: ${metadata.placeholder}`)
  return parts.length ? parts.join(' · ') : '—'
}

async function loadSurvey() {
  try {
    const response = await fetchAdminSurvey(surveyId.value)
    if (response.success) {
      survey.value = response.data
    }
  } catch {
    // survey title is optional for the page
  }
}

async function loadSections() {
  const response = await fetchAdminSections(surveyId.value)
  if (response.success) {
    sections.value = [...response.data].sort((a, b) => a.sortOrder - b.sortOrder)
  } else {
    throw new Error(response.message || 'Không thể tải danh sách phần')
  }
}

async function loadQuestions() {
  const response = await fetchAdminQuestions(surveyId.value)
  if (response.success) {
    questions.value = response.data
  } else {
    throw new Error(response.message || 'Không thể tải danh sách câu hỏi')
  }
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([loadSurvey(), loadSections(), loadQuestions()])
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu'
  } finally {
    loading.value = false
  }
}

function buildPayload() {
  const meta = form.value.metadata
  const metadata = {}

  if (meta.hasOther) {
    metadata.hasOther = true
    if (meta.otherPlaceholder.trim()) {
      metadata.otherPlaceholder = meta.otherPlaceholder.trim()
    }
  }
  if (meta.hint.trim()) metadata.hint = meta.hint.trim()
  if (meta.maxSelect !== '' && meta.maxSelect != null) {
    metadata.maxSelect = Number(meta.maxSelect)
  }
  if (meta.placeholder.trim()) metadata.placeholder = meta.placeholder.trim()

  const payload = {
    label: form.value.label.trim(),
    type: form.value.type,
    options: form.value.type === 'text'
      ? null
      : form.value.options.map((o) => o.trim()).filter(Boolean),
    isRequired: form.value.isRequired,
    sectionId: form.value.sectionId ? Number(form.value.sectionId) : form.value.sectionId,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  }

  if (formMode.value === 'edit') {
    payload.isActive = form.value.isActive
  }

  return payload
}

function fillFormFromQuestion(question) {
  const meta = question.metadata || {}
  form.value = {
    label: question.label,
    type: question.type,
    options: question.options?.length ? [...question.options] : [''],
    isRequired: question.isRequired,
    isActive: question.isActive ?? true,
    sectionId: question.sectionId,
    metadata: {
      hasOther: !!meta.hasOther,
      otherPlaceholder: meta.otherPlaceholder || '',
      hint: meta.hint || '',
      maxSelect: meta.maxSelect ?? '',
      placeholder: meta.placeholder || '',
    },
  }
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  form.value = emptyForm()
  if (sections.value.length === 1) {
    form.value.sectionId = sections.value[0].id
  }
  formError.value = ''
  showFormModal.value = true
}

function openEditModal(question) {
  formMode.value = 'edit'
  editingId.value = question.id
  fillFormFromQuestion(question)
  formError.value = ''
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  formError.value = ''
}

async function openDetailModal(questionId) {
  showDetailModal.value = true
  detailLoading.value = true
  detailQuestion.value = null
  try {
    const response = await fetchAdminQuestion(surveyId.value, questionId)
    if (response.success) {
      detailQuestion.value = response.data
    } else {
      error.value = response.message || 'Không thể tải chi tiết câu hỏi'
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
  detailQuestion.value = null
}

function openToggleActiveModal(question) {
  toggleActiveTarget.value = question
  showToggleActiveModal.value = true
}

function closeToggleActiveModal() {
  showToggleActiveModal.value = false
  toggleActiveTarget.value = null
}

function addOption() {
  form.value.options.push('')
}

function removeOption(index) {
  if (form.value.options.length <= 1) {
    form.value.options = ['']
    return
  }
  form.value.options.splice(index, 1)
}

async function handleSubmitForm() {
  formError.value = ''

  if (!form.value.label.trim()) {
    formError.value = 'Vui lòng nhập nội dung câu hỏi'
    return
  }
  if (!form.value.sectionId) {
    formError.value = 'Vui lòng chọn phần'
    return
  }
  if (form.value.type !== 'text') {
    const validOptions = form.value.options.map((o) => o.trim()).filter(Boolean)
    if (validOptions.length === 0) {
      formError.value = 'Vui lòng nhập ít nhất một lựa chọn'
      return
    }
  }

  formLoading.value = true
  try {
    const payload = buildPayload()
    const response = formMode.value === 'create'
      ? await createAdminQuestion(surveyId.value, payload)
      : await updateAdminQuestion(surveyId.value, editingId.value, payload)

    if (response.success) {
      closeFormModal()
      await loadData()
    } else {
      formError.value = response.message || 'Thao tác thất bại'
    }
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Thao tác thất bại'
  } finally {
    formLoading.value = false
  }
}

function openCreateSectionModal() {
  sectionFormMode.value = 'create'
  editingSectionId.value = null
  sectionForm.value = emptySectionForm()
  sectionFormError.value = ''
  showSectionFormModal.value = true
}

function openEditSectionModal(section) {
  sectionFormMode.value = 'edit'
  editingSectionId.value = section.id
  sectionForm.value = {
    title: section.title,
  }
  sectionFormError.value = ''
  showSectionFormModal.value = true
}

function closeSectionFormModal() {
  showSectionFormModal.value = false
  sectionFormError.value = ''
}

async function handleSubmitSectionForm() {
  sectionFormError.value = ''

  if (!sectionForm.value.title.trim()) {
    sectionFormError.value = 'Vui lòng nhập tiêu đề phần'
    return
  }

  sectionFormLoading.value = true
  try {
    const payload = {
      title: sectionForm.value.title.trim(),
    }

    const response = sectionFormMode.value === 'create'
      ? await createAdminSection(surveyId.value, payload)
      : await updateAdminSection(surveyId.value, editingSectionId.value, payload)

    if (response.success) {
      closeSectionFormModal()
      await loadData()
    } else {
      sectionFormError.value = response.message || 'Thao tác thất bại'
    }
  } catch (err) {
    sectionFormError.value = err.response?.data?.message || err.message || 'Thao tác thất bại'
  } finally {
    sectionFormLoading.value = false
  }
}

function openSectionToggleActiveModal(section) {
  sectionToggleActiveTarget.value = section
  showSectionToggleActiveModal.value = true
}

function closeSectionToggleActiveModal() {
  showSectionToggleActiveModal.value = false
  sectionToggleActiveTarget.value = null
}

async function handleToggleActiveSection() {
  if (!sectionToggleActiveTarget.value) return

  sectionToggleActiveLoading.value = true
  try {
    const response = sectionToggleActiveTarget.value.isActive
      ? await deleteAdminSection(surveyId.value, sectionToggleActiveTarget.value.id)
      : await restoreAdminSection(surveyId.value, sectionToggleActiveTarget.value.id)

    if (response.success) {
      closeSectionToggleActiveModal()
      await loadData()
    } else {
      error.value = response.message || 'Không thể cập nhật trạng thái phần'
      closeSectionToggleActiveModal()
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái phần'
    closeSectionToggleActiveModal()
  } finally {
    sectionToggleActiveLoading.value = false
  }
}

async function handleToggleActive() {
  if (!toggleActiveTarget.value) return

  toggleActiveLoading.value = true
  try {
    const response = toggleActiveTarget.value.isActive
      ? await deleteAdminQuestion(surveyId.value, toggleActiveTarget.value.id)
      : await updateAdminQuestion(surveyId.value, toggleActiveTarget.value.id, { isActive: true })
    if (response.success) {
      closeToggleActiveModal()
      await loadData()
    } else {
      error.value = response.message || 'Không thể cập nhật trạng thái câu hỏi'
      closeToggleActiveModal()
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái câu hỏi'
    closeToggleActiveModal()
  } finally {
    toggleActiveLoading.value = false
  }
}

watch(() => form.value.type, (type) => {
  if (type === 'text') {
    form.value.options = ['']
  }
})

watch(surveyId, () => {
  showFormModal.value = false
  showDetailModal.value = false
  showToggleActiveModal.value = false
  showSectionFormModal.value = false
  showSectionToggleActiveModal.value = false
  formError.value = ''
  sectionFormError.value = ''
  loadData()
})

onMounted(() => loadData())
</script>

<template>
  <div class="survey-questions-page">
    <div class="page-heading">
      <div>
        <RouterLink to="/survey-forms" class="back-link">← Quay lại danh sách phiếu</RouterLink>
        <h2>Quản lý câu hỏi</h2>
        <p v-if="survey" class="subtitle">{{ survey.title }}</p>
        <p v-else class="subtitle">Phiếu #{{ surveyId }}</p>
      </div>
      <div class="heading-actions">
        <button class="btn-secondary" @click="openCreateSectionModal">+ Thêm phần</button>
        <button class="btn-primary" :disabled="sections.length === 0" @click="openCreateModal">
          + Thêm câu hỏi
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="loading-state">Đang tải dữ liệu...</div>

    <template v-else>
      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Tổng câu hỏi</span>
          <span class="stat-value">{{ questions.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Số phần</span>
          <span class="stat-value">{{ sections.length }}</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3>Danh sách phần</h3>
        </div>

        <div v-if="sections.length === 0" class="panel-empty">
          Chưa có phần nào. Nhấn "Thêm phần" để tạo phần đầu tiên.
        </div>

        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Section key</th>
                <th>Tiêu đề</th>
                <th>Thứ tự</th>
                <th>Trạng thái</th>
                <th class="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="section in sections" :key="section.id">
                <td><code class="field-key">{{ section.sectionKey }}</code></td>
                <td class="cell-label">{{ section.title }}</td>
                <td class="cell-order">{{ section.sortOrder }}</td>
                <td>
                  <span class="badge" :class="section.isActive ? 'badge-active' : 'badge-inactive'">
                    {{ section.isActive ? 'Hoạt động' : 'Tắt' }}
                  </span>
                </td>
                <td class="col-actions">
                  <div class="action-buttons">
                    <button class="btn-action" @click="openEditSectionModal(section)">Sửa</button>
                    <button
                      class="btn-action"
                      :class="section.isActive ? 'btn-danger' : 'btn-success'"
                      @click="openSectionToggleActiveModal(section)"
                    >
                      {{ section.isActive ? 'Ẩn' : 'Hiện' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="questions-area">
        <h3 class="area-title">Câu hỏi theo phần</h3>

        <div v-if="sections.length === 0" class="empty-state">
          Tạo phần trước khi thêm câu hỏi.
        </div>

        <div v-else class="section-list">
          <section v-for="group in groupedQuestions" :key="group.section.id" class="section-group">
            <h4 class="section-title">{{ group.title }}</h4>

            <div v-if="group.questions.length === 0" class="section-empty">
              Chưa có câu hỏi trong phần này.
            </div>

            <div v-else class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Câu hỏi</th>
                    <th>Loại</th>
                    <th>Bắt buộc</th>
                    <th>Trạng thái</th>
                    <th>Thứ tự</th>
                    <th class="col-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="question in group.questions" :key="question.id">
                    <td><code class="field-key">{{ question.fieldKey }}</code></td>
                    <td class="cell-label">{{ question.label }}</td>
                    <td>
                      <span class="type-badge">{{ typeLabel(question.type) }}</span>
                    </td>
                    <td>
                      <span class="badge" :class="question.isRequired ? 'badge-required' : 'badge-optional'">
                        {{ question.isRequired ? 'Có' : 'Không' }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" :class="question.isActive ? 'badge-active' : 'badge-inactive'">
                        {{ question.isActive ? 'Hoạt động' : 'Đang ẩn' }}
                      </span>
                    </td>
                    <td class="cell-order">{{ question.sortOrder }}</td>
                    <td class="col-actions">
                      <div class="action-buttons">
                        <button class="btn-action" @click="openDetailModal(question.id)">Xem</button>
                        <button class="btn-action" @click="openEditModal(question)">Sửa</button>
                        <button
                          class="btn-action"
                          :class="question.isActive ? 'btn-danger' : 'btn-success'"
                          @click="openToggleActiveModal(question)"
                        >
                          {{ question.isActive ? 'Ẩn' : 'Hiện' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </template>

    <!-- Section form modal -->
    <div v-if="showSectionFormModal" class="modal-overlay" @click.self="closeSectionFormModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ sectionFormMode === 'create' ? 'Thêm phần' : 'Chỉnh sửa phần' }}</h3>
          <button class="btn-close" @click="closeSectionFormModal">×</button>
        </div>

        <form class="modal-form" @submit.prevent="handleSubmitSectionForm">
          <div v-if="sectionFormError" class="alert alert-error">{{ sectionFormError }}</div>

          <label class="field">
            <span>Tiêu đề phần <span class="required">*</span></span>
            <input
              v-model="sectionForm.title"
              type="text"
              :disabled="sectionFormLoading"
              placeholder="Phần 1. Thông tin cơ bản"
            />
          </label>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" :disabled="sectionFormLoading" @click="closeSectionFormModal">
              Hủy
            </button>
            <button type="submit" class="btn-primary" :disabled="sectionFormLoading">
              {{ sectionFormLoading ? 'Đang lưu...' : (sectionFormMode === 'create' ? 'Thêm phần' : 'Lưu thay đổi') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Section toggle active modal -->
    <div v-if="showSectionToggleActiveModal" class="modal-overlay" @click.self="closeSectionToggleActiveModal">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Xác nhận {{ sectionToggleActiveTarget?.isActive ? 'ẩn' : 'hiện' }} phần</h3>
          <button class="btn-close" @click="closeSectionToggleActiveModal">×</button>
        </div>

        <div class="modal-body">
          <p class="delete-message">
            Bạn có chắc muốn {{ sectionToggleActiveTarget?.isActive ? 'ẩn' : 'hiện' }} phần
            <strong>"{{ sectionToggleActiveTarget?.title }}"</strong>?
          </p>

          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              :disabled="sectionToggleActiveLoading"
              @click="closeSectionToggleActiveModal"
            >
              Hủy
            </button>
            <button
              type="button"
              :class="sectionToggleActiveTarget?.isActive ? 'btn-danger-solid' : 'btn-primary'"
              :disabled="sectionToggleActiveLoading"
              @click="handleToggleActiveSection"
            >
              {{
                sectionToggleActiveLoading
                  ? 'Đang xử lý...'
                  : (sectionToggleActiveTarget?.isActive ? 'Ẩn phần' : 'Hiện phần')
              }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form modal -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ formMode === 'create' ? 'Thêm câu hỏi' : 'Chỉnh sửa câu hỏi' }}</h3>
          <button class="btn-close" @click="closeFormModal">×</button>
        </div>

        <form class="modal-form" @submit.prevent="handleSubmitForm">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>

          <label class="field">
            <span>Nội dung câu hỏi <span class="required">*</span></span>
            <input v-model="form.label" type="text" :disabled="formLoading" placeholder="Độ tuổi của bạn" />
          </label>

          <div class="form-row">
            <label class="field">
              <span>Loại câu hỏi <span class="required">*</span></span>
              <select v-model="form.type" :disabled="formLoading">
                <option v-for="t in QUESTION_TYPES" :key="t.value" :value="t.value">
                  {{ t.label }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>Phần <span class="required">*</span></span>
              <select v-model="form.sectionId" :disabled="formLoading">
                <option value="">-- Chọn phần --</option>
                <option v-for="section in sections" :key="section.id" :value="section.id">
                  {{ section.title }}
                </option>
              </select>
            </label>
          </div>

          <label class="field-checkbox">
            <input v-model="form.isRequired" type="checkbox" :disabled="formLoading" />
            <span>Bắt buộc trả lời</span>
          </label>

          <label v-if="formMode === 'edit'" class="field-checkbox">
            <input v-model="form.isActive" type="checkbox" :disabled="formLoading" />
            <span>Kích hoạt câu hỏi</span>
          </label>

          <div v-if="form.type !== 'text'" class="options-editor">
            <span class="field-label">Lựa chọn <span class="required">*</span></span>
            <div v-for="(option, index) in form.options" :key="index" class="option-row">
              <input
                v-model="form.options[index]"
                type="text"
                :disabled="formLoading"
                :placeholder="`Lựa chọn ${index + 1}`"
              />
              <button type="button" class="btn-icon" :disabled="formLoading" @click="removeOption(index)">
                ×
              </button>
            </div>
            <button type="button" class="btn-add-option" :disabled="formLoading" @click="addOption">
              + Thêm lựa chọn
            </button>
          </div>

          <div class="metadata-section">
            <span class="field-label">Metadata (tùy chọn)</span>

            <template v-if="form.type === 'text'">
              <label class="field">
                <span>Placeholder</span>
                <input
                  v-model="form.metadata.placeholder"
                  type="text"
                  :disabled="formLoading"
                  placeholder="Chia sẻ suy nghĩ của bạn..."
                />
              </label>
              <label class="field">
                <span>Gợi ý</span>
                <input v-model="form.metadata.hint" type="text" :disabled="formLoading" placeholder="(câu hỏi mở)" />
              </label>
            </template>

            <template v-else>
              <label class="field">
                <span>Gợi ý</span>
                <input v-model="form.metadata.hint" type="text" :disabled="formLoading" placeholder="(Chọn tối đa 3)" />
              </label>

              <label v-if="form.type === 'multiple'" class="field">
                <span>Số lựa chọn tối đa</span>
                <input
                  v-model="form.metadata.maxSelect"
                  type="number"
                  min="1"
                  :disabled="formLoading"
                  placeholder="3"
                />
              </label>

              <label class="field-checkbox">
                <input v-model="form.metadata.hasOther" type="checkbox" :disabled="formLoading" />
                <span>Có lựa chọn "Khác"</span>
              </label>

              <label v-if="form.metadata.hasOther" class="field">
                <span>Placeholder cho "Khác"</span>
                <input
                  v-model="form.metadata.otherPlaceholder"
                  type="text"
                  :disabled="formLoading"
                  placeholder="Vui lòng ghi rõ..."
                />
              </label>
            </template>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" :disabled="formLoading" @click="closeFormModal">
              Hủy
            </button>
            <button type="submit" class="btn-primary" :disabled="formLoading">
              {{ formLoading ? 'Đang lưu...' : (formMode === 'create' ? 'Thêm câu hỏi' : 'Lưu thay đổi') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>Chi tiết câu hỏi</h3>
          <button class="btn-close" @click="closeDetailModal">×</button>
        </div>

        <div v-if="detailLoading" class="modal-body loading-state">Đang tải...</div>

        <div v-else-if="detailQuestion" class="modal-body">
          <dl class="detail-list">
            <div class="detail-row">
              <dt>Field key</dt>
              <dd><code class="field-key">{{ detailQuestion.fieldKey }}</code></dd>
            </div>
            <div class="detail-row">
              <dt>Câu hỏi</dt>
              <dd>{{ detailQuestion.label }}</dd>
            </div>
            <div class="detail-row">
              <dt>Loại</dt>
              <dd>{{ typeLabel(detailQuestion.type) }}</dd>
            </div>
            <div class="detail-row">
              <dt>Phần</dt>
              <dd>{{ detailQuestion.section?.title || '—' }}</dd>
            </div>
            <div class="detail-row">
              <dt>Bắt buộc</dt>
              <dd>{{ detailQuestion.isRequired ? 'Có' : 'Không' }}</dd>
            </div>
            <div class="detail-row">
              <dt>Thứ tự</dt>
              <dd>{{ detailQuestion.sortOrder }}</dd>
            </div>
            <div class="detail-row">
              <dt>Trạng thái</dt>
              <dd>
                <span class="badge" :class="detailQuestion.isActive ? 'badge-active' : 'badge-inactive'">
                  {{ detailQuestion.isActive ? 'Hoạt động' : 'Tắt' }}
                </span>
              </dd>
            </div>
            <div v-if="detailQuestion.options?.length" class="detail-row">
              <dt>Lựa chọn</dt>
              <dd>
                <ul class="options-list">
                  <li v-for="(opt, i) in detailQuestion.options" :key="i">{{ opt }}</li>
                </ul>
              </dd>
            </div>
            <div class="detail-row">
              <dt>Metadata</dt>
              <dd>{{ formatMetadata(detailQuestion.metadata) }}</dd>
            </div>
            <div class="detail-row">
              <dt>Ngày tạo</dt>
              <dd>{{ formatDate(detailQuestion.createdAt) }}</dd>
            </div>
            <div class="detail-row">
              <dt>Cập nhật</dt>
              <dd>{{ formatDate(detailQuestion.updatedAt) }}</dd>
            </div>
          </dl>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeDetailModal">Đóng</button>
            <button type="button" class="btn-primary" @click="openEditModal(detailQuestion); closeDetailModal()">
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle active modal -->
    <div v-if="showToggleActiveModal" class="modal-overlay" @click.self="closeToggleActiveModal">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Xác nhận {{ toggleActiveTarget?.isActive ? 'ẩn' : 'hiện' }} câu hỏi</h3>
          <button class="btn-close" @click="closeToggleActiveModal">×</button>
        </div>

        <div class="modal-body">
          <p class="delete-message">
            Bạn có chắc muốn {{ toggleActiveTarget?.isActive ? 'ẩn' : 'hiện' }} câu hỏi
            <strong>"{{ toggleActiveTarget?.label }}"</strong>?
          </p>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" :disabled="toggleActiveLoading" @click="closeToggleActiveModal">
              Hủy
            </button>
            <button
              type="button"
              :class="toggleActiveTarget?.isActive ? 'btn-danger-solid' : 'btn-primary'"
              :disabled="toggleActiveLoading"
              @click="handleToggleActive"
            >
              {{
                toggleActiveLoading
                  ? 'Đang xử lý...'
                  : (toggleActiveTarget?.isActive ? 'Ẩn câu hỏi' : 'Hiện câu hỏi')
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--color-primary);
  text-decoration: none;
  margin-bottom: 8px;
}

.back-link:hover {
  text-decoration: underline;
}

.heading-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

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
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
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

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: 32px;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  font-size: 1rem;
  font-weight: 600;
}

.panel-empty {
  padding: 24px 20px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.questions-area {
  margin-top: 8px;
}

.area-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-text);
}

.section-empty {
  padding: 16px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  background: #fafbfc;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
}

.section-form-row {
  grid-template-columns: 1fr 100px;
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
  padding: 12px 14px;
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

.field-key {
  font-size: 0.85rem;
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: 4px;
}

.cell-label {
  max-width: 360px;
}

.cell-order {
  color: var(--color-text-muted);
}

.type-badge {
  font-size: 0.75rem;
  background: #eff6ff;
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
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
}

.btn-action:hover {
  background: var(--color-bg);
}

.btn-action.btn-danger {
  color: var(--color-error-text);
  border-color: #fecaca;
}

.btn-action.btn-success {
  color: #166534;
  border-color: #bbf7d0;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-required {
  background: #fef3c7;
  color: #92400e;
}

.badge-optional {
  background: #f1f5f9;
  color: #64748b;
}

.badge-active {
  background: #dcfce7;
  color: #166534;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
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
  max-width: 600px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span,
.field-label {
  font-size: 0.875rem;
  font-weight: 600;
}

.required {
  color: var(--color-error-text);
}

.field input,
.field select,
.field textarea {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.options-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  display: flex;
  gap: 8px;
}

.option-row input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.btn-icon {
  width: 36px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1.2rem;
  color: var(--color-text-muted);
}

.btn-add-option {
  align-self: flex-start;
  padding: 6px 12px;
  background: var(--color-bg);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--color-primary);
}

.metadata-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid var(--color-border);
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
  grid-template-columns: 120px 1fr;
  gap: 8px 16px;
}

.detail-row dt {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.options-list {
  margin: 0;
  padding-left: 18px;
  font-size: 0.9rem;
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

@media (max-width: 640px) {
  .page-heading {
    flex-direction: column;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .detail-row {
    grid-template-columns: 1fr;
  }
}
</style>
