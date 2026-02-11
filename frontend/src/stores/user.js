import { defineStore } from 'pinia'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  getters: {
    isLogin: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isEditor: (state) => state.user?.role === 'editor' || state.user?.role === 'admin'
  },

  actions: {
    // 设置token
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    // 设置用户信息
    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },

    // 登录
    async login(loginForm) {
      try {
        const res = await authApi.login(loginForm)
        this.setToken(res.token)
        this.setUser(res.user)
        return res
      } catch (error) {
        throw error
      }
    },

    // 注册
    async register(registerForm) {
      try {
        const res = await authApi.register(registerForm)
        this.setToken(res.token)
        this.setUser(res.user)
        return res
      } catch (error) {
        throw error
      }
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const user = await authApi.getCurrentUser()
        this.setUser(user)
        return user
      } catch (error) {
        throw error
      }
    },

    // 退出登录
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
