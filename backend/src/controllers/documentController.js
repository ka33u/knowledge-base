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
    const { q, category, status, author, tags, dateFrom, dateTo } = req.query;

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

    // 搜索关键词 - 分级匹配：标题 > 标签 > 描述 > 内容
    if (q && q.trim().length > 0) {
      const keywords = q.trim().split(/\s+/).filter(k => k.length > 0);
      
      // 构建OR条件
      const buildOrConditions = (field) => 
        keywords.map(keyword => ({ [field]: { $regex: keyword, $options: 'i' } }));
      
      // 1. 先查标题匹配的
      let documents = await Document.find({ ...query, $or: buildOrConditions('title') })
        .populate('author', 'username email avatar')
        .populate('reviewer', 'username email avatar')
        .populate('category', 'name color');
      
      // 2. 如果没有，查询标签匹配的
      if (documents.length === 0) {
        documents = await Document.find({ ...query, $or: buildOrConditions('tags') })
          .populate('author', 'username email avatar')
          .populate('reviewer', 'username email avatar')
          .populate('category', 'name color');
        
        // 3. 如果还是没有，查询描述匹配的
        if (documents.length === 0) {
          documents = await Document.find({ ...query, $or: buildOrConditions('description') })
            .populate('author', 'username email avatar')
            .populate('reviewer', 'username email avatar')
            .populate('category', 'name color');
          
          // 4. 最后才查询内容匹配的
          if (documents.length === 0) {
            documents = await Document.find({ ...query, $or: buildOrConditions('content') })
              .populate('author', 'username email avatar')
              .populate('reviewer', 'username email avatar')
              .populate('category', 'name color');
          }
        }
      }

      // 应用分页
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const paginatedDocs = documents.slice(startIndex, startIndex + parseInt(limit));
      
      // 处理高亮显示
      const highlightedDocs = paginatedDocs.map(doc => {
        const docObj = doc.toObject();
        
        keywords.forEach(keyword => {
          const lowerKeyword = keyword.toLowerCase();
          
          if (docObj.title?.toLowerCase().includes(lowerKeyword)) {
            docObj.title = docObj.title.replace(
              new RegExp(`(${keyword})`, 'gi'),
              '<mark>$1</mark>'
            );
          }
          
          if (docObj.description?.toLowerCase().includes(lowerKeyword)) {
            docObj.description = docObj.description.replace(
              new RegExp(`(${keyword})`, 'gi'),
              '<mark>$1</mark>'
            );
          }
          
          if (docObj.content?.toLowerCase().includes(lowerKeyword)) {
            docObj.content = docObj.content.replace(
              new RegExp(`(${keyword})`, 'gi'),
              '<mark>$1</mark>'
            );
          }
          
          if (docObj.tags) {
            docObj.tags = docObj.tags.map(tag => {
              if (tag.toLowerCase().includes(lowerKeyword)) {
                return tag.replace(new RegExp(`(${keyword})`, 'gi'), '<mark>$1</mark>');
              }
              return tag;
            });
          }
        });

        return docObj;
      });

      return success(res, paginateResponse(documents.length, page, limit, highlightedDocs));
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

    // 日期范围筛选
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // 查询总数
    const total = await Document.countDocuments(query);

    // 查询文档列表
    let documents = await Document.find(query)
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
 * 搜索文档 - 增强版（分级匹配）
 * @route GET /api/documents/search
 */
exports.searchDocuments = async (req, res, next) => {
  try {
    const { q, category, tags, dateFrom, dateTo, author } = req.query;
    const { page, limit, sort } = buildPagination(req.query);

    if (!q || q.trim().length === 0) {
      return error(res, '请输入搜索关键词');
    }

    // 解析搜索关键词（支持多关键词，空格分隔）
    const keywords = q.trim().split(/\s+/).filter(k => k.length > 0);

    // 构建基础查询条件（只显示已发布的文档）
    const baseQuery = { isPublished: true };

    // 添加分类筛选
    if (category) {
      baseQuery.category = category;
    }

    // 添加标签筛选
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      baseQuery.tags = { $in: tagArray };
    }

    // 添加日期范围筛选
    if (dateFrom || dateTo) {
      baseQuery.createdAt = {};
      if (dateFrom) baseQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) baseQuery.createdAt.$lte = new Date(dateTo);
    }

    // 添加作者筛选
    if (author) {
      baseQuery.author = author;
    }

    // 构建OR条件
    const buildOrConditions = (field) => 
      keywords.map(keyword => ({ [field]: { $regex: keyword, $options: 'i' } }));

    // 分级搜索：标题 > 标签 > 描述 > 内容
    let documents = [];
    let foundCount = 0;

    // 1. 标题匹配
    documents = await Document.find({ ...baseQuery, $or: buildOrConditions('title') })
      .populate('author', 'username email avatar')
      .populate('category', 'name color');

    // 2. 标签匹配（排除已找到的）
    if (documents.length === 0) {
      const foundIds = documents.map(d => d._id);
      documents = await Document.find({
        ...baseQuery,
        _id: { $nin: foundIds },
        $or: buildOrConditions('tags')
      })
        .populate('author', 'username email avatar')
        .populate('category', 'name color');

      // 3. 描述匹配（排除已找到的）
      if (documents.length === 0) {
        const foundIds = documents.map(d => d._id);
        documents = await Document.find({
          ...baseQuery,
          _id: { $nin: foundIds },
          $or: buildOrConditions('description')
        })
          .populate('author', 'username email avatar')
          .populate('category', 'name color');

        // 4. 内容匹配（排除已找到的）
        if (documents.length === 0) {
          const foundIds = documents.map(d => d._id);
          documents = await Document.find({
            ...baseQuery,
            _id: { $nin: foundIds },
            $or: buildOrConditions('content')
          })
            .populate('author', 'username email avatar')
            .populate('category', 'name color');
        }
      }
    }

    foundCount = documents.length;

    // 应用分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedDocs = documents.slice(startIndex, startIndex + parseInt(limit));

    // 处理高亮显示
    const highlightedDocs = paginatedDocs.map(doc => {
      const docObj = doc.toObject();
      
      keywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        
        if (docObj.title?.toLowerCase().includes(lowerKeyword)) {
          docObj.title = docObj.title.replace(
            new RegExp(`(${keyword})`, 'gi'),
            '<mark>$1</mark>'
          );
        }
        
        if (docObj.description?.toLowerCase().includes(lowerKeyword)) {
          docObj.description = docObj.description.replace(
            new RegExp(`(${keyword})`, 'gi'),
            '<mark>$1</mark>'
          );
        }
        
        if (docObj.content?.toLowerCase().includes(lowerKeyword)) {
          docObj.content = docObj.content.replace(
            new RegExp(`(${keyword})`, 'gi'),
            '<mark>$1</mark>'
          );
        }
        
        if (docObj.tags) {
          docObj.tags = docObj.tags.map(tag => {
            if (tag.toLowerCase().includes(lowerKeyword)) {
              return tag.replace(new RegExp(`(${keyword})`, 'gi'), '<mark>$1</mark>');
            }
            return tag;
          });
        }
      });

      return docObj;
    });

    return success(res, {
      ...paginateResponse(foundCount, page, limit, highlightedDocs),
      searchKeywords: keywords
    });
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
