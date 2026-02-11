const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');

/**
 * 用户注册
 * @route POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return error(res, '用户名或邮箱已被注册');
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // 生成 token
    const token = generateToken(user._id);

    return success(res, {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    }, '注册成功', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * 用户登录
 * @route POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return error(res, '邮箱或密码错误');
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, '邮箱或密码错误');
    }

    // 检查账户是否激活
    if (!user.isActive) {
      return error(res, '账户已被禁用');
    }

    // 更新最后登录时间
    user.lastLogin = Date.now();
    await user.save();

    // 生成 token
    const token = generateToken(user._id);

    return success(res, {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    }, '登录成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取当前用户信息
 * @route GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;

    return success(res, {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      lastLogin: user.lastLogin
    }, '获取用户信息成功');
  } catch (err) {
    next(err);
  }
};
