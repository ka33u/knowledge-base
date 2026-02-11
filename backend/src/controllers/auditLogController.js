const AuditLog = require('../models/AuditLog');
const Document = require('../models/Document');
const { buildPagination, paginateResponse } = require('../utils/pagination');
const { success, notFound } = require('../utils/response');

/**
 * 获取审核日志列表
 * @route GET /api/audit-logs
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPagination(req.query);
    const { document, actor, action } = req.query;

    // 构建查询条件
    const query = {};

    if (document) {
      query.document = document;
    }

    if (actor) {
      query.actor = actor;
    }

    if (action) {
      query.action = action;
    }

    // 查询总数
    const total = await AuditLog.countDocuments(query);

    // 查询日志列表
    const logs = await AuditLog.find(query)
      .populate('document', 'title')
      .populate('actor', 'username email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return success(res, paginateResponse(total, page, limit, logs));
  } catch (err) {
    next(err);
  }
};

/**
 * 获取文档的审核历史
 * @route GET /api/audit-logs/document/:documentId
 */
exports.getDocumentAuditLogs = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    // 检查文档是否存在
    const document = await Document.findById(documentId);
    if (!document) {
      return notFound(res, '文档不存在');
    }

    const logs = await AuditLog.find({ document: documentId })
      .populate('actor', 'username email avatar')
      .sort({ createdAt: 1 });

    return success(res, logs);
  } catch (err) {
    next(err);
  }
};
