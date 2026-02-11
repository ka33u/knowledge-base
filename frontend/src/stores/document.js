import { defineStore } from 'pinia'

export const useDocumentStore = defineStore('document', {
  state: () => ({
    documents: [],
    currentDocument: null,
    total: 0,
    loading: false
  }),

  actions: {
    setDocuments(documents) {
      this.documents = documents
    },

    setCurrentDocument(document) {
      this.currentDocument = document
    },

    setTotal(total) {
      this.total = total
    },

    setLoading(loading) {
      this.loading = loading
    },

    addDocument(document) {
      this.documents.unshift(document)
      this.total++
    },

    updateDocument(id, document) {
      const index = this.documents.findIndex(doc => doc._id === id)
      if (index !== -1) {
        this.documents[index] = { ...this.documents[index], ...document }
      }
      if (this.currentDocument?._id === id) {
        this.currentDocument = { ...this.currentDocument, ...document }
      }
    },

    removeDocument(id) {
      this.documents = this.documents.filter(doc => doc._id !== id)
      this.total--
      if (this.currentDocument?._id === id) {
        this.currentDocument = null
      }
    }
  }
})
