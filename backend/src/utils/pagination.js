/**
 * 构建分页查询
 * @param {object} query - 查询参数
 * @returns {object} 分页选项
 */
exports.buildPagination = (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order === 'asc' ? 1 : -1;

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    sort: { [sortBy]: order }
  };
};

/**
 * 构建分页响应
 * @param {number} total - 总记录数
 * @param {number} page - 当前页码
 * @param {number} limit - 每页数量
 * @param {array} data - 数据列表
 * @returns {object} 分页响应对象
 */
exports.paginateResponse = (total, page, limit, data) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};
