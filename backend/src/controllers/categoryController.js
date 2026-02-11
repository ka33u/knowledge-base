const Category = require('../models/Category');
const { success, error, notFound } = require('../utils/response');

/**
 * 获取所有分类
 * @route GET /api/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });

    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取单个分类
 * @route GET /api/categories/:id
 */
exports.getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return notFound(res, '分类不存在');
    }

    return success(res, category);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建分类
 * @route POST /api/categories
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, color, sortOrder } = req.body;

    const category = new Category({
      name,
      description,
      icon,
      color,
      sortOrder
    });

    await category.save();

    return success(res, category, '分类创建成功', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * 更新分类
 * @route PUT /api/categories/:id
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, sortOrder, isActive } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return notFound(res, '分类不存在');
    }

    // 更新字段
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    return success(res, category, '分类更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除分类
 * @route DELETE /api/categories/:id
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return notFound(res, '分类不存在');
    }

    // 软删除 - 设置为不活跃
    category.isActive = false;
    await category.save();

    return success(res, null, '分类已删除');
  } catch (err) {
    next(err);
  }
};
