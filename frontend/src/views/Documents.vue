<template>
  <div class="documents-page">
    <el-card shadow="never">
      <!-- 搜索和筛选 -->
      <div class="search-section">
        <el-row :gutter="16" class="search-row">
          <el-col :span="6">
            <el-input
              v-model="searchQuery"
              placeholder="搜索文档标题、内容、标签..."
              clearable
              @input="handleSearchInput"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
              <template #append>
                <el-button @click="toggleAdvancedSearch">
                  <el-icon><Filter /></el-icon>
                </el-button>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filterCategory" placeholder="选择分类" clearable @change="fetchDocuments">
              <el-option
                v-for="cat in categories"
                :key="cat._id"
                :label="cat.name"
                :value="cat._id"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filterStatus" placeholder="选择状态" clearable @change="fetchDocuments">
              <el-option label="草稿" value="draft" />
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-col>
          <el-col :span="10" class="text-right">
            <el-button type="primary" @click="router.push('/documents/create')">
              <el-icon><Plus /></el-icon>
              创建文档
            </el-button>
          </el-col>
        </el-row>

        <!-- 高级搜索面板 -->
        <el-collapse-transition>
          <div v-if="showAdvancedSearch" class="advanced-search">
            <el-row :gutter="16">
              <el-col :span="8">
                <span class="label">日期范围：</span>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  @change="fetchDocuments"
                />
              </el-col>
              <el-col :span="4">
                <el-button type="primary" @click="fetchDocuments">
                  <el-icon><Search /></el-icon>
                  应用筛选
                </el-button>
              </el-col>
              <el-col :span="4">
                <el-button @click="clearFilters">
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
              </el-col>
            </el-row>
          </div>
        </el-collapse-transition>

        <!-- 搜索历史 -->
        <div v-if="searchHistory.length > 0" class="search-history-bar">
          <span class="history-label">
            <el-icon><Clock /></el-icon>
            搜索历史
          </span>
          <div class="history-tags">
            <el-tag
              v-for="(item, index) in searchHistory"
              :key="index"
              class="history-tag"
              closable
              @click="selectHistory(item)"
              @close="deleteHistory(index)"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-button text size="small" @click="clearAllHistory" class="clear-btn">
            清空
          </el-button>
        </div>

        <!-- 搜索结果提示 -->
        <div v-if="searchQuery && !loading" class="search-tip">
          <el-icon><InfoFilled /></el-icon>
          找到 <strong>{{ total }}</strong> 个相关文档
        </div>
      </div>

      <!-- 文档列表 -->
      <el-table :data="documents" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDocument(row._id)">
              <span v-html="row._highlight?.title || row.title"></span>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span v-if="row._highlight?.description" v-html="row._highlight.description"></span>
            <span v-else-if="row.description" class="description-text">{{ row.description.substring(0, 100) }}...</span>
            <span v-else class="no-description">无描述</span>
          </template>
        </el-table-column>
        <el-table-column prop="category.name" label="分类" width="120">
          <template #default="{ row }">
            <el-tag :color="row.category?.color" effect="plain">
              {{ row.category?.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author.username" label="作者" width="120" />
        <el-table-column label="浏览/下载" width="120">
          <template #default="{ row }">
            <span>{{ row.viewCount }} / {{ row.downloadCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="150">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px;"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDocument(row._id)">
              查看
            </el-button>
            <el-button
              v-if="row.status === 'draft' && row.author._id === userStore.user?._id"
              link
              type="primary"
              size="small"
              @click="editDocument(row._id)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 'draft' && row.author._id === userStore.user?._id"
              link
              type="success"
              size="small"
              @click="submitDocument(row._id)"
            >
              提交审核
            </el-button>
            <el-button
              v-if="row.status === 'pending' && userStore.isEditor"
              link
              type="warning"
              size="small"
              @click="reviewDocument(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="row.status === 'draft' && row.author._id === userStore.user?._id"
              link
              type="danger"
              size="small"
              @click="deleteDocument(row._id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchDocuments"
          @current-change="fetchDocuments"
        />
      </div>
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="reviewDialogVisible" title="审核文档" width="500px">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewForm.approved">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="reviewForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReview">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDocumentStore } from '@/stores/document'
import { useCategoryStore } from '@/stores/category'
import { documentApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Filter, Clock, Close, Refresh, InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const documentStore = useDocumentStore()
const categoryStore = useCategoryStore()

const loading = ref(false)
const documents = ref([])
const categories = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchQuery = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const dateRange = ref([])
const showAdvancedSearch = ref(false)
const searchHistory = ref([])

const reviewDialogVisible = ref(false)
const currentReviewDoc = ref(null)
const reviewForm = reactive({
  approved: true,
  comment: ''
})

// 从localStorage加载搜索历史
const loadSearchHistory = () => {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
}

// 保存搜索历史
const saveSearchHistory = (query) => {
  if (!query || query.trim().length < 2) return
  
  const history = [...searchHistory.value]
  const index = history.indexOf(query)
  
  if (index > -1) {
    history.splice(index, 1)
  }
  
  history.unshift(query)
  
  // 最多保留10条
  if (history.length > 10) {
    history.pop()
  }
  
  searchHistory.value = history
  localStorage.setItem('searchHistory', JSON.stringify(history))
}

// 选择历史搜索
const selectHistory = (query) => {
  searchQuery.value = query
  currentPage.value = 1
  fetchDocuments()
}

// 删除单条历史记录
const deleteHistory = (index) => {
  searchHistory.value.splice(index, 1)
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 清空所有历史
const clearAllHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
  showHistory.value = false
}

// 切换高级搜索
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value
}

// 清空筛选
const clearFilters = () => {
  searchQuery.value = ''
  filterCategory.value = ''
  filterStatus.value = ''
  dateRange.value = []
  currentPage.value = 1
  fetchDocuments()
}

const fetchDocuments = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    if (searchQuery.value) {
      params.q = searchQuery.value
      // 保存搜索历史（防抖）
      debouncedSaveHistory(searchQuery.value)
    }
    
    if (filterCategory.value) params.category = filterCategory.value
    if (filterStatus.value) params.status = filterStatus.value
    if (dateRange.value && dateRange.value.length === 2) {
      params.dateFrom = dateRange.value[0]
      params.dateTo = dateRange.value[1]
    }

    const res = await documentApi.getList(params)
    documents.value = res.data
    total.value = res.pagination.total
  } catch (error) {
    console.error('获取文档列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 防抖保存搜索历史
let historyTimer = null
const debouncedSaveHistory = (query) => {
  clearTimeout(historyTimer)
  historyTimer = setTimeout(() => {
    saveSearchHistory(query)
  }, 1000)
}

const fetchCategories = async () => {
  try {
    const res = await categoryStore.setCategories(await documentApi.category?.getList?.() || [])
    categories.value = categoryStore.categories
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

let searchTimer = null

// 输入时防抖搜索
const handleSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchDocuments()
    if (searchQuery.value.trim()) {
      saveSearchHistory(searchQuery.value.trim())
    }
  }, 500)
}

// 搜索（回车时执行）
const handleSearch = () => {
  currentPage.value = 1
  fetchDocuments()
  if (searchQuery.value.trim()) {
    saveSearchHistory(searchQuery.value.trim())
  }
}

const viewDocument = (id) => {
  router.push(`/documents/${id}`)
}

const editDocument = (id) => {
  router.push(`/documents/${id}/edit`)
}

const submitDocument = async (id) => {
  try {
    await ElMessageBox.confirm('确定要提交审核吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await documentApi.submit(id)
    ElMessage.success('提交成功')
    fetchDocuments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
    }
  }
}

const reviewDocument = (document) => {
  currentReviewDoc.value = document
  reviewForm.approved = true
  reviewForm.comment = ''
  reviewDialogVisible.value = true
}

const confirmReview = async () => {
  try {
    await documentApi.review(currentReviewDoc.value._id, reviewForm)
    ElMessage.success(reviewForm.approved ? '审核通过' : '已拒绝')
    reviewDialogVisible.value = false
    fetchDocuments()
  } catch (error) {
    console.error('审核失败:', error)
  }
}

const deleteDocument = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除此文档吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await documentApi.delete(id)
    ElMessage.success('删除成功')
    fetchDocuments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusLabel = (status) => {
  const labelMap = {
    draft: '草稿',
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return labelMap[status] || status
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  fetchDocuments()
  fetchCategories()
  loadSearchHistory()
})
</script>

<style scoped lang="scss">
.documents-page {
  .search-section {
    margin-bottom: 20px;
  }

  .search-row {
    margin-bottom: 12px;
  }

  .search-history-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 8px 12px;
    background: #fafafa;
    border-radius: 4px;
    margin-top: 12px;

    .history-label {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: #909399;
      margin-right: 12px;

      .el-icon {
        margin-right: 4px;
      }
    }

    .history-tags {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .history-tag {
        cursor: pointer;

        &:hover {
          background-color: #ecf5ff;
          color: #409eff;
        }
      }
    }

    .clear-btn {
      color: #909399;
      font-size: 12px;

      &:hover {
        color: #409eff;
      }
    }
  }

  .advanced-search {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 12px;

    .label {
      display: inline-block;
      margin-right: 8px;
      color: #606266;
    }
  }

  .search-tip {
    padding: 8px 12px;
    background: #ecf5ff;
    border-radius: 4px;
    color: #409eff;
    font-size: 14px;
    margin-bottom: 12px;

    .el-icon {
      margin-right: 6px;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  // 搜索高亮样式
  :deep(mark) {
    background: #fde68a;
    padding: 0 4px;
    border-radius: 2px;
    color: #d97706;
    font-weight: bold;
  }

  .description-text {
    color: #606266;
    font-size: 13px;
  }

  .no-description {
    color: #c0c4cc;
    font-style: italic;
  }
}
</style>
