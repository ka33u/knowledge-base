const express = require('express');
const router = express.Router();

const documentController = require('../controllers/documentController');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');
const { validate, idParam, searchValidation } = require('../middlewares/validate');

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: 获取文档列表
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 分类ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, approved, rejected]
 *         description: 状态
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: 排序字段
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/', authenticate, searchValidation, validate, documentController.getDocuments);

/**
 * @swagger
 * /api/documents/search:
 *   get:
 *     summary: 搜索文档
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 搜索成功
 */
router.get('/search', authenticate, documentController.searchDocuments);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: 获取单个文档
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 文档不存在
 */
router.get('/:id', authenticate, idParam, validate, documentController.getDocument);

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: 下载文档
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 下载成功
 */
router.get('/:id/download', authenticate, idParam, validate, documentController.downloadDocument);

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: 创建文档
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - title
 *               - category
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post(
  '/',
  authenticate,
  uploadSingle,
  documentController.createDocument
);

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: 更新文档
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', authenticate, idParam, validate, documentController.updateDocument);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: 删除文档
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', authenticate, idParam, validate, documentController.deleteDocument);

/**
 * @swagger
 * /api/documents/{id}/submit:
 *   post:
 *     summary: 提交文档审核
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 提交成功
 */
router.post('/:id/submit', authenticate, idParam, validate, documentController.submitDocument);

/**
 * @swagger
 * /api/documents/{id}/review:
 *   put:
 *     summary: 审核文档
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: 审核成功
 */
router.put('/:id/review', authenticate, authorize('admin', 'editor'), idParam, validate, documentController.reviewDocument);

module.exports = router;
