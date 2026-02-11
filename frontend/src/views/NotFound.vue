<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>页面不存在</h2>
      <p>抱歉，您访问的页面不存在或已被删除。</p>
      <el-button type="primary" @click="goHome">
        <el-icon><HomeFilled /></el-icon>
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/documents')
}
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .not-found-content {
    text-align: center;
    color: #fff;

    h1 {
      font-size: 120px;
      margin: 0;
      font-weight: bold;
      text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    h2 {
      font-size: 32px;
      margin: 16px 0 24px;
    }

    p {
      font-size: 16px;
      margin-bottom: 32px;
      opacity: 0.9;
    }
  }
}
</style>
