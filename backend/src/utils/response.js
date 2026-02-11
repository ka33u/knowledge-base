/**
 * 成功响应
 */
exports.success = (res, data, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * 错误响应
 */
exports.error = (res, message = '操作失败', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * 未找到响应
 */
exports.notFound = (res, message = '资源不存在') => {
  return res.status(404).json({
    success: false,
    message
  });
};
