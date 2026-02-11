const { body, validationResult, param, query } = require('express-validator');

/**
 * 验证结果检查中间件
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errors.array()
    });
  }
  next();
};

/**
 * 注册验证规则
 */
exports.registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度应在3-30个字符之间'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少6个字符')
];

/**
 * 登录验证规则
 */
exports.loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码')
];

/**
 * 文档验证规则
 */
exports.documentValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ max: 200 })
    .withMessage('标题最多200个字符'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('描述最多500个字符'),
  body('category')
    .notEmpty()
    .withMessage('请选择分类'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
];

/**
 * 分类验证规则
 */
exports.categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('分类名称不能为空')
    .isLength({ max: 50 })
    .withMessage('分类名称最多50个字符'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('描述最多200个字符')
];

/**
 * ID 参数验证
 */
exports.idParam = [
  param('id')
    .isMongoId()
    .withMessage('无效的 ID')
];

/**
 * 搜索查询验证
 */
exports.searchValidation = [
  query('q')
    .optional()
    .trim(),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('无效的分类ID'),
  query('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'rejected'])
    .withMessage('无效的状态'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须大于0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量应在1-100之间'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'viewCount'])
    .withMessage('无效的排序字段'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向只能是 asc 或 desc')
];
