<template>
  <div class="document-edit-page">
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>编辑文档</span>
          <el-button @click="router.back()">返回</el-button>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        size="large"
      >
        <el-form-item label="文档标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文档标题" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat._id"
              :label="cat.name"
              :value="cat._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入文档描述"
          />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            placeholder="请输入标签，按回车添加"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="当前文件">
          <el-alert type="info" :closable="false">
            {{ document?.file?.originalName }}
            <br>
            大小: {{ formatFileSize(document?.file?.size) }}
          </el-alert>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ submitting ? '保存中...' : '保存修改' }}
          </el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { documentApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const document = ref(null)
const categories = ref([])

const form = reactive({
  title: '',
  description: '',
  category: '',
  tags: []
})

const rules = {
  title: [
    { required: true, message: '请输入文档标题', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

const fetchDocument = async () => {
  loading.value = true
  try {
    document.value = await documentApi.getDetail(route.params.id)
    form.title = document.value.title
    form.description = document.value.description
    form.category = document.value.category._id
    form.tags = document.value.tags || []
  } catch (error) {
    console.error('获取文档失败:', error)
    ElMessage.error('获取文档失败')
    router.back()
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    await documentApi.update(route.params.id, {
      title: form.title,
      description: form.description,
      category: form.category,
      tags: form.tags
    })

    ElMessage.success('保存成功')
    router.push(`/documents/${route.params.id}`)
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    submitting.value = false
  }
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
.document-edit-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
