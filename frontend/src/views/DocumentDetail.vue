<template>
  <div class="document-detail-page" v-loading="loading">
    <el-card shadow="never" v-if="document">
      <!-- 头部信息 -->
      <div class="detail-header">
        <div class="title-row">
          <h2>{{ document.title }}</h2>
          <div class="actions">
            <el-button
              v-if="document.status === 'approved'"
              type="primary"
              @click="documentApi.download(document._id)"
            >
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button
              v-if="canEdit"
              @click="router.push(`/documents/${document._id}/edit`)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              v-if="document.status === 'draft' && canEdit"
              type="success"
              @click="submitReview"
            >
              <el-icon><Check /></el-icon>
              提交审核
            </el-button>
          </div>
        </div>
        <div class="meta-info">
          <el-tag :type="getStatusType(document.status)" size="large">
            {{ getStatusLabel(document.status) }}
          </el-tag>
          <span class="meta-item">
            <el-icon><User /></el-icon>
            作者: {{ document.author?.username }}
          </span>
          <span class="meta-item">
            <el-icon><Folder /></el-icon>
            分类: {{ document.category?.name }}
          </span>
          <span class="meta-item">
            <el-icon><View /></el-icon>
            浏览: {{ document.viewCount }}
          </span>
          <span class="meta-item">
            <el-icon><Download /></el-icon>
            下载: {{ document.downloadCount }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            创建于: {{ formatDate(document.createdAt) }}
          </span>
        </div>
      </div>

      <!-- 描述 -->
      <div v-if="document.description" class="detail-section">
        <h3>描述</h3>
        <p>{{ document.description }}</p>
      </div>

      <!-- 标签 -->
      <div v-if="document.tags && document.tags.length > 0" class="detail-section">
        <h3>标签</h3>
        <div class="tags">
          <el-tag
            v-for="tag in document.tags"
            :key="tag"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <!-- 文件信息 -->
      <div class="detail-section">
        <h3>文件信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="文件名">
            {{ document.file.originalName }}
          </el-descriptions-item>
          <el-descriptions-item label="文件类型">
            <el-tag>{{ document.fileType.toUpperCase() }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">
            {{ formatFileSize(document.file.size) }}
          </el-descriptions-item>
          <el-descriptions-item label="版本">
            v{{ document.version }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 审核信息 -->
      <div v-if="document.status !== 'draft'" class="detail-section">
        <h3>审核信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="审核人">
            {{ document.reviewer?.username || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="审核意见">
            {{ document.reviewComment || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="document.publishedAt" label="发布时间">
            {{ formatDate(document.publishedAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 审核历史 -->
      <div class="detail-section">
        <h3>审核历史</h3>
        <el-timeline>
          <el-timeline-item
            v-for="log in auditLogs"
            :key="log._id"
            :timestamp="formatDate(log.createdAt)"
          >
            <div class="log-item">
              <strong>{{ getActionLabel(log.action) }}</strong>
              <span class="log-actor">- {{ log.actor?.username }}</span>
              <p v-if="log.comment" class="log-comment">{{ log.comment }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { documentApi, auditLogApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const document = ref(null)
const auditLogs = ref([])

const canEdit = computed(() => {
  return document.value?.author._id === userStore.user?._id && document.value?.status === 'draft'
})

const fetchDocument = async () => {
  loading.value = true
  try {
    document.value = await documentApi.getDetail(route.params.id)
    await fetchAuditLogs()
  } catch (error) {
    console.error('获取文档详情失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchAuditLogs = async () => {
  try {
    auditLogs.value = await auditLogApi.getDocumentLogs(route.params.id)
  } catch (error) {
    console.error('获取审核历史失败:', error)
  }
}

const submitReview = async () => {
  try {
    await ElMessageBox.confirm('确定要提交审核吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await documentApi.submit(route.params.id)
    ElMessage.success('提交成功')
    fetchDocument()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
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

const getActionLabel = (action) => {
  const labelMap = {
    created: '创建',
    updated: '更新',
    submitted: '提交审核',
    approved: '审核通过',
    rejected: '审核拒绝',
    deleted: '删除',
    published: '发布'
  }
  return labelMap[action] || action
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

onMounted(() => {
  fetchDocument()
})
</script>

<style scoped lang="scss">
.document-detail-page {
  .detail-header {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #ebeef5;

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;

      h2 {
        margin: 0;
        font-size: 24px;
        color: #303133;
      }

      .actions {
        display: flex;
        gap: 8px;
      }
    }

    .meta-info {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #606266;
        font-size: 14px;

        .el-icon {
          color: #909399;
        }
      }
    }
  }

  .detail-section {
    margin-bottom: 32px;

    h3 {
      font-size: 16px;
      color: #303133;
      margin-bottom: 12px;
    }

    p {
      color: #606266;
      line-height: 1.6;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .tag-item {
        margin: 0;
      }
    }

    .log-item {
      .log-actor {
        color: #909399;
        margin-left: 8px;
      }

      .log-comment {
        margin: 4px 0 0 0;
        color: #606266;
        font-size: 14px;
      }
    }
  }
}
</style>
