import request from '@/utils/request'

/**
 * 用户认证相关API
 */
export const authApi = {
  // 注册
  register(data) {
    return request({
      url: '/auth/register',
      method: 'post',
      data
    })
  },

  // 登录
  login(data) {
    return request({
      url: '/auth/login',
      method: 'post',
      data
    })
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request({
      url: '/auth/me',
      method: 'get'
    })
  }
}

/**
 * 文档相关API
 */
export const documentApi = {
  // 获取文档列表
  getList(params) {
    return request({
      url: '/documents',
      method: 'get',
      params
    })
  },

  // 获取文档详情
  getDetail(id) {
    return request({
      url: `/documents/${id}`,
      method: 'get'
    })
  },

  // 创建文档
  create(formData) {
    return request({
      url: '/documents',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 更新文档
  update(id, data) {
    return request({
      url: `/documents/${id}`,
      method: 'put',
      data
    })
  },

  // 删除文档
  delete(id) {
    return request({
      url: `/documents/${id}`,
      method: 'delete'
    })
  },

  // 提交审核
  submit(id) {
    return request({
      url: `/documents/${id}/submit`,
      method: 'post'
    })
  },

  // 审核文档
  review(id, data) {
    return request({
      url: `/documents/${id}/review`,
      method: 'put',
      data
    })
  },

  // 搜索文档
  search(params) {
    return request({
      url: '/documents/search',
      method: 'get',
      params
    })
  },

  // 下载文档
  download(id) {
    window.open(`/api/documents/${id}/download`, '_blank')
  }
}

/**
 * 分类相关API
 */
export const categoryApi = {
  // 获取分类列表
  getList() {
    return request({
      url: '/categories',
      method: 'get'
    })
  },

  // 获取分类详情
  getDetail(id) {
    return request({
      url: `/categories/${id}`,
      method: 'get'
    })
  },

  // 创建分类
  create(data) {
    return request({
      url: '/categories',
      method: 'post',
      data
    })
  },

  // 更新分类
  update(id, data) {
    return request({
      url: `/categories/${id}`,
      method: 'put',
      data
    })
  },

  // 删除分类
  delete(id) {
    return request({
      url: `/categories/${id}`,
      method: 'delete'
    })
  }
}

/**
 * 审核日志相关API
 */
export const auditLogApi = {
  // 获取审核日志列表
  getList(params) {
    return request({
      url: '/audit-logs',
      method: 'get',
      params
    })
  },

  // 获取文档的审核历史
  getDocumentLogs(documentId) {
    return request({
      url: `/audit-logs/document/${documentId}`,
      method: 'get'
    })
  }
}

/**
 * 用户相关API
 */
export const userApi = {
  // 获取用户列表
  getList(params) {
    return request({
      url: '/users',
      method: 'get',
      params
    })
  },

  // 获取用户详情
  getDetail(id) {
    return request({
      url: `/users/${id}`,
      method: 'get'
    })
  },

  // 更新用户
  update(id, data) {
    return request({
      url: `/users/${id}`,
      method: 'put',
      data
    })
  },

  // 删除用户
  delete(id) {
    return request({
      url: `/users/${id}`,
      method: 'delete'
    })
  }
}
