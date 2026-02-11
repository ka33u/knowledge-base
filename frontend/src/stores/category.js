import { defineStore } from 'pinia'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    loading: false
  }),

  actions: {
    setCategories(categories) {
      this.categories = categories
    },

    setLoading(loading) {
      this.loading = loading
    },

    addCategory(category) {
      this.categories.push(category)
    },

    updateCategory(id, category) {
      const index = this.categories.findIndex(cat => cat._id === id)
      if (index !== -1) {
        this.categories[index] = { ...this.categories[index], ...category }
      }
    },

    removeCategory(id) {
      this.categories = this.categories.filter(cat => cat._id !== id)
    }
  }
})
