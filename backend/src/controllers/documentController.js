const Document = require('../models/Document');
const User = require('../models/User');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { extractContent, getFileType, deleteFile } = require('../utils/fileHandler');
const { buildPagination, paginateResponse } = require('../utils/pagination');
const { success, error, notFound } = require('../utils/response');

/**
 * 获取文档列表
 * @route GET /api/documents
 */
exports.getDocuments = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPagination(req.query);
    const { q, category, status, author, tags } = req.query;

    // 构建查询条件
    const query = {};

    // 只有已发布的文档或作者自己的草稿可以被普通用户查看
    if (req.user.role === 'user') {
      query.$or = [
        { isPublished: true },
        { author: req.user._id, status: 'draft' }
      ];
    }

    // 编辑和管理员可以查看所有文档
    if (req.user.role === 'editor' || req.user.role === 'admin') {
      // 可以查看所有文档
    }

    // 搜索关键词
    if (q) {
      query.$text = { $search: q };
    }

    // 分类筛选
    if (category) {
      query.category = category;
    }

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 作者筛选
    if (author) {
      query.author = author;
    }

    // 标签筛选
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // 查询总数
    const total = await Document.countDocuments(query);

    // 查询文档列表
    const documents = await Document.find(query)
      .populate('author', 'username email avatar')
      .populate('reviewer', 'username email avatar')
      .populate('category', 'name color')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return success(res, paginateResponse(total, page, limit, documents));
  } catch (err) {
    next(err);
  }
};

/**
 * 获取单个文档
 * @route GET /api/documents/:id
 */
exports.getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id)
      .populate('author', 'username email avatar')
      .populate('reviewer', 'username email avatar')
      .populate('category', 'name description color');

    if (!document) {
      return notFound(res, '文档不存在');
    }

    // 权限检查
    if (req.user.role === 'user' && document.author._id.toString() !== req.user._id.toString() && !document.isPublished) {
      return error(res, '无权访问此文档', 403);
    }

    // 增加浏览计数
    document.viewCount += 1;
    await document.save();

    return success(res, document);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建文档
 * @route POST /api/documents
 */
exports.createDocument = async (req, res, next) => {
  try {
    const { title, description, category, tags } = req.body;
    const file = req.file;

    if (!file) {
      return error(res, '请上传文件');
    }

    // 提取文件内容
    const content = await extractContent(file);

    // 获取文件类型
    const fileType = getFileType(file.mimetype);

    // 创建文档
    const document = new Document({
      title,
      description,
      content,
      file: {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      },
      fileType,
      category,
      tags: tags || [],
      author: req.user._id
    });

    await document.save();

    // 创建审核日志
    await AuditLog.create({
      document: document._id,
      action: 'created',
      actor: req.user._id,
      previousStatus: '',
      newStatus: 'draft'
    });

    const populatedDoc = await Document.findById(document._id)
      .populate('author', 'username email avatar')
      .populate('category', 'name color');

    return success(res, populatedDoc, '文档创建成功', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * 更新文档
 * @route PUT /api/documents/:id
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags } = req.body;

    const document = await Document.findById(id);

    if (!document) {
      return notFound(res, '文档不存在');
    }

    // 权限检查
    if (document.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return error(res, '无权编辑此文档', 403);
    }

    // 只有草稿状态可以编辑
    if (document.status !== 'draft') {
      return error(res, '只有草稿状态的文档可以编辑');
    }

    // 更新字段
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (tags !== undefined) document.tags = tags;

    document.version += 1;
    await document.save();

    // 创建审核日志
    await AuditLog.create({
      document: document._id,
      action: 'updated',
      actor: req.user._id,
      metadata: { version: document.version }
    });

    const updatedDoc = await Document.findById(document._id)
      .populate('author', 'username email avatar')
      .populate('category', 'name color');

    return success(res, updatedDoc, '文档更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除文档
 * @route DELETE /api/documents/:id
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      return notFound(res, '文档不存在');
    }

    // 权限检查
    if (document.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return error(res, '无权删除此文档', 403);
    }

    // 删除文件
    await deleteFile(document.file.path);

    // 删除文档
    await Document.findByIdAndDelete(id);

    // 创建审核日志
    await AuditLog.create({
      document: document._id,
      action: 'deleted',
      actor: req.user._id,
      metadata: { title: document.title }
    });

    return success(res, null, '文档删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 提交审核
 * @route POST /api/documents/:id/submit
 */
exports.submitDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      return notFound(res, '文档不存在');
    }

    // 权限检查
    if (document.author.toString() !== req.user._id.toString()) {
      return error(res, '无权提交此文档', 403);
    }

    // 状态检查
    if (document.status !== 'draft') {
      return error(res, '只有草稿状态的文档可以提交审核');
    }

    // 更新状态
    document.status = 'pending';
    await document.save();

    // 创建审核日志
    await AuditLog.create({
      document: document._id,
      action: 'submitted',
      actor: req.user._id,
      previousStatus: 'draft',
      newStatus: 'pending'
    });

    const updatedDoc = await Document.findById(document._id)
      .populate('author', 'username email avatar')
      .populate('category', 'name color');

    return success(res, updatedDoc, '文档已提交审核');
  } catch (err) {
    next(err);
  }
};

/**
 * 审核文档
 * @route PUT /api/documents/:id/review
 */
exports.reviewDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, comment } = req.body;

    if (typeof approved !== 'boolean') {
      return error(res, '请指定审核结果');
    }

    const document = await Document.findById(id);

    if (!document) {
      return notFound(res, '文档不存在');
    }

    // 权限检查 - 只有编辑和管理员可以审核
    if (req.user.role === 'user') {
      return error(res, '无权审核文档', 403);
    }

    // 状态检查
    if (document.status !== 'pending') {
      return error(res, '只有待审核状态的文档可以审核');
    }

    // 更新状态和审核人
    document.status = approved ? 'approved' : 'rejected';
    document.reviewer = req.user._id;
    document.reviewComment = comment || '';

    // 如果审核通过，发布文档
    if (approved) {
      document.isPublished = true;
      document.publishedAt = new Date();
    }

    await document.save();

    // 创建审核日志
    await AuditLog.create({
      document: document._id,
      action: approved ? 'approved' : 'rejected',
      actor: req.user._id,
      previousStatus: 'pending',
      newStatus: approved ? 'approved' : 'rejected',
      comment
    });

    const updatedDoc = await Document.findById(document._id)
      .populate('author', 'username email avatar')
      .populate('reviewer', 'username email avatar')
      .populate('category', 'name color');

    return success(res, updatedDoc, approved ? '文档已通过审核' : '文档已拒绝');
  } catch (err) {
    next(err);
  }
};

/**
 * 搜索文档 - 增强版
 * @route GET /api/documents/search
 */
exports.searchDocuments = async (req, res, next) => {
  try {
    const { q, category, tags, dateFrom, dateTo, author } = req.query;
    const { page, limit, skip, sort } = buildPagination(req.query);

    if (!q) {
      return error(res, '请输入搜索关键词');
    }

    // 构建查询条件
    const query = {
      $text: { $search: q },
      isPublished: true // 只搜索已发布的文档
    };

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // 日期范围筛选
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // 作者筛选
    if (author) {
      query.author = author;
    }

    // 查询总数
    const total = await Document.countDocuments(query);

    // 查询文档列表
    const documents = await Document.find(query, {
      score: { $meta: 'textScore' }
    })
      .populate('author', 'username email avatar')
      .populate('category', 'name color')
      .sort({ score: { $meta: 'textScore' }, ...sort })
      .skip(skip)
      .limit(limit);

    // 处理高亮显示
    const highlightedDocs = documents.map(doc => {
      const docObj = doc.toObject();
      const highlightFields = ['title', 'description', 'content'];
      const keywords = q.split(' ').filter(k => k);

      highlightFields.forEach(field => {
        if (docObj[field] && keywords.length > 0) {
          keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            docObj[field] = docObj[field].replace(regex, '<mark>$1</mark>');
          });
        }
      });

      return docObj;
    });

    return success(res, paginateResponse(total, page, limit, highlightedDocs));
  } catch (err) {
    next(err);
  }
};

/**
 * 下载文档
 * @route GET /api/documents/:id/download
 */
exports.downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      return notFound(res, '文档不存在');
    }

    // 权限检查
    if (req.user.role === 'user' && document.author.toString() !== req.user._id.toString() && !document.isPublished) {
      return error(res, '无权下载此文档', 403);
    }

    // 增加下载计数
    document.downloadCount += 1;
    await document.save();

    // 发送文件
    res.download(document.file.path, document.file.originalName);
  } catch (err) {
    next(err);
  }
};
