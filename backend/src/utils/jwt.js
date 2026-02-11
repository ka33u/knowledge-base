const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 生成 JWT Token
 * @param {string} userId - 用户ID
 * @returns {string} JWT Token
 */
exports.generateToken = (userId) => {
  return jwt.sign(
    { userId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @returns {object} 解码后的 token
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};
