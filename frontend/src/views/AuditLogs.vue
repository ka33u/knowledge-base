<template>
  <div class="audit-logs-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>审核日志</span>
        </div>
      </template>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-row :gutter="16">
          <el-col :span="4">
            <el-select v-model="filterAction" placeholder="操作类型" clearable @change="fetchLogs">
              <el-option label="创建" value="created" />
              <el-option label="更新" value="updated" />
              <el-option label="提交审核" value="submitted" />
              <el-option label="审核通过" value="approved" />
              <el-option label="审核拒绝" value="rejected" />
              <el-option label="删除" value="deleted" />
            </el-select>
          </el-col>
        </el-row>
      </div>

      <el-timeline v-loading="loading">
        <el-timeline-item
          v-for="log in logs"
          :key="log._id"
          :timestamp="formatDate(log.createdAt)"
          placement="top"
        >
          <el-card shadow="hover" class="log-card">
            <div class="log-header">
              <div class="log-action">
                <el-tag :type="getActionTagType(log.action)" size="large">
                  {{ getActionLabel(log.action) }}
                </el-tag>
                <el-link type="primary" :href="`/documents/${log.document._id}`" target="_blank">
                  {{ log.document?.title }}
                </el-link>
              </div>
              <div class="log-actor">
                <el-avatar :size="24" :src="log.actor?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
                <span>{{ log.actor?.username }}</span>
              </div>
            </div>
            <div v-if="log.previousStatus || log.newStatus" class="log-status">
              状态变更: 
              <el-tag size="small" :type="getStatusType(log.previousStatus)">
                {{ getStatusLabel(log.previousStatus) }}
              </el-tag>
              <el-icon><ArrowRight /></el-icon>
              <el-tag size="small" :type="getStatusType(log.newStatus)">
                {{ getStatusLabel(log.newStatus) }}
              </el-tag>
            </div>
            <div v-if="log.comment" class="log-comment">
              <strong>审核意见:</strong> {{ log.comment }}
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchLogs"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auditLogApi } from '@/api'
import { ArrowRight } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const logs = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const filterAction = ref('')

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (filterAction.value) params.action = filterAction.value

    const res = await auditLogApi.getList(params)
    logs.value = res.data
    total.value = res.pagination.total
  } catch (error) {
    console.error('获取审核日志失败:', error)
  } finally {
    loading.value = false
  }
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

const getActionTagType = (action) => {
  const typeMap = {
    created: 'info',
    updated: '',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
    deleted: 'danger',
    published: 'success'
  }
  return typeMap[action] || ''
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

const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped lang="scss">
.audit-logs-page {
  .filter-bar {
    margin-bottom: 20px;
  }

  .log-card {
    margin-bottom: 12px;

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .log-action {
        display: flex;
        align-items: center;
        gap: 12px;

        .el-link {
          font-size: 16px;
          font-weight: 500;
        }
      }

      .log-actor {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #909399;
        font-size: 14px;
      }
    }

    .log-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: #606266;
    }

    .log-comment {
      color: #606266;
      line-height: 1.6;
      padding: 8px;
      background-color: #f5f7fa;
      border-radius: 4px;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
