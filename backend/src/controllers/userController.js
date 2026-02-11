const User = require('../models/User');
const { buildPagination, paginateResponse } = require('../utils/pagination');
const { success, error, notFound } = require('../utils/response');

/**
 * 获取用户列表
 * @route GET /api/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPagination(req.query);
    const { role, isActive } = req.query;

    // 构建查询条件
    const query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // 查询总数
    const total = await User.countDocuments(query);

    // 查询用户列表
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return success(res, paginateResponse(total, page, limit, users));
  } catch (err) {
    next(err);
  }
};

/**
 * 获取单个用户
 * @route GET /api/users/:id
 */
exports.getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return notFound(res, '用户不存在');
    }

    return success(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * 更新用户
 * @route PUT /api/users/:id
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, role, isActive, avatar } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return notFound(res, '用户不存在');
    }

    // 权限检查 - 只有管理员可以修改其他用户
    if (req.user.role !== 'admin' && id !== req.user._id.toString()) {
      return error(res, '权限不足', 403);
    }

    // 非管理员不能修改角色和状态
    if (req.user.role !== 'admin') {
      if (role || isActive !== undefined) {
        return error(res, '权限不足', 403);
      }
    }

    // 更新字段
    if (username) user.username = username;
    if (email) user.email = email;
    if (role && req.user.role === 'admin') user.role = role;
    if (isActive !== undefined && req.user.role === 'admin') user.isActive = isActive;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    return success(res, updatedUser, '用户更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除用户
 * @route DELETE /api/users/:id
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return notFound(res, '用户不存在');
    }

    // 权限检查 - 只有管理员可以删除用户
    if (req.user.role !== 'admin') {
      return error(res, '权限不足', 403);
    }

    // 不能删除自己
    if (id === req.user._id.toString()) {
      return error(res, '不能删除自己');
    }

    await User.findByIdAndDelete(id);

    return success(res, null, '用户删除成功');
  } catch (err) {
    next(err);
  }
};
