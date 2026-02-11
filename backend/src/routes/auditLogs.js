const express = require('express');
const router = express.Router();

const auditLogController = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: 获取审核日志列表
 *     tags: [Audit Logs]
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
 *         name: document
 *         schema:
 *           type: string
 *         description: 文档ID
 *       - in: query
 *         name: actor
 *         schema:
 *           type: string
 *         description: 操作者ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [created, updated, submitted, approved, rejected, deleted, published]
 *         description: 操作类型
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/', authenticate, validate, auditLogController.getAuditLogs);

/**
 * @swagger
 * /api/audit-logs/document/{documentId}:
 *   get:
 *     summary: 获取文档的审核历史
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 文档不存在
 */
router.get('/document/:documentId', authenticate, auditLogController.getDocumentAuditLogs);

module.exports = router;
