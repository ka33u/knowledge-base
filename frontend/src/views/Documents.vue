<template>
  <div class="documents-page">
    <el-card shadow="never">
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-input
              v-model="searchQuery"
              placeholder="搜索文档..."
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
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
      </div>

      <!-- 文档列表 -->
      <el-table :data="documents" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDocument(row._id)">
              {{ row.title }}
            </el-link>
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
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDocumentStore } from '@/stores/document'
import { useCategoryStore } from '@/stores/category'
import { documentApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
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

const reviewDialogVisible = ref(false)
const currentReviewDoc = ref(null)
const reviewForm = reactive({
  approved: true,
  comment: ''
})

const fetchDocuments = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (searchQuery.value) params.q = searchQuery.value
    if (filterCategory.value) params.category = filterCategory.value
    if (filterStatus.value) params.status = filterStatus.value

    const res = await documentApi.getList(params)
    documents.value = res.data
    total.value = res.pagination.total
  } catch (error) {
    console.error('获取文档列表失败:', error)
  } finally {
    loading.value = false
  }
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
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchDocuments()
  }, 500)
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
})
</script>

<style scoped lang="scss">
.documents-page {
  .search-bar {
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
