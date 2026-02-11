<template>
  <div class="document-create-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>创建文档</span>
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
        <el-form-item label="上传文件" prop="file" required>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :file-list="fileList"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、Word、Markdown 格式，文件大小不超过 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            {{ loading ? '创建中...' : '创建文档' }}
          </el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoryStore } from '@/stores/category'
import { documentApi } from '@/api'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const router = useRouter()
const categoryStore = useCategoryStore()

const formRef = ref(null)
const uploadRef = ref(null)
const loading = ref(false)
const fileList = ref([])
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

const fetchCategories = async () => {
  try {
    const res = await documentApi.category?.getList?.()
    if (res) {
      categories.value = res
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const handleFileChange = (file) => {
  fileList.value = [file]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  if (fileList.value.length === 0) {
    ElMessage.error('请上传文件')
    return
  }

  try {
    await formRef.value.validate()
    loading.value = true

    const formData = new FormData()
    formData.append('file', fileList.value[0].raw)
    formData.append('title', form.title)
    formData.append('description', form.description)
    formData.append('category', form.category)
    if (form.tags.length > 0) {
      form.tags.forEach(tag => {
        formData.append('tags[]', tag)
      })
    }

    await documentApi.create(formData)
    ElMessage.success('文档创建成功')
    router.push('/documents')
  } catch (error) {
    console.error('创建失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped lang="scss">
.document-create-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
