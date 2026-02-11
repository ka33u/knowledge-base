<template>
  <div class="profile-page">
    <el-row :gutter="24">
      <el-col :span="8">
        <el-card shadow="never">
          <div class="profile-info">
            <el-avatar :size="120" :src="userStore.user?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
            <h2>{{ userStore.user?.username }}</h2>
            <p class="email">{{ userStore.user?.email }}</p>
            <el-tag :type="getRoleTagType(userStore.user?.role)" size="large">
              {{ getRoleLabel(userStore.user?.role) }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <span>个人资料</span>
          </template>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
          >
            <el-form-item label="用户名">
              <el-input v-model="form.username" disabled />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="form.email" disabled />
            </el-form-item>
            <el-form-item label="头像">
              <el-input v-model="form.avatar" placeholder="请输入头像URL" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleSubmit">
                {{ loading ? '保存中...' : '保存修改' }}
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div class="account-info">
            <h3>账户信息</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="注册时间">
                {{ formatDate(userStore.user?.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="最后登录">
                {{ userStore.user?.lastLogin ? formatDate(userStore.user?.lastLogin) : '首次登录' }}
              </el-descriptions-item>
              <el-descriptions-item label="账户状态">
                <el-tag :type="userStore.user?.isActive ? 'success' : 'danger'">
                  {{ userStore.user?.isActive ? '正常' : '已禁用' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  avatar: ''
})

const rules = {}

onMounted(() => {
  form.username = userStore.user?.username || ''
  form.email = userStore.user?.email || ''
  form.avatar = userStore.user?.avatar || ''
})

const handleSubmit = async () => {
  loading.value = true
  try {
    await userApi.update(userStore.user.id, { avatar: form.avatar })
    await userStore.getUserInfo()
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    loading.value = false
  }
}

const getRoleLabel = (role) => {
  const roleMap = {
    admin: '管理员',
    editor: '编辑',
    user: '用户'
  }
  return roleMap[role] || role
}

const getRoleTagType = (role) => {
  const typeMap = {
    admin: 'danger',
    editor: 'warning',
    user: 'info'
  }
  return typeMap[role] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style scoped lang="scss">
.profile-page {
  .profile-info {
    text-align: center;
    padding: 24px 0;

    h2 {
      margin: 16px 0 8px;
      color: #303133;
    }

    .email {
      color: #909399;
      margin-bottom: 16px;
    }
  }

  .account-info {
    h3 {
      margin-bottom: 16px;
      color: #303133;
    }
  }
}
</style>
