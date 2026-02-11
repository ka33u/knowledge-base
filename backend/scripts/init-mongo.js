// MongoDB 初始化脚本
db = db.getSiblingDB('knowledge-base');

// 创建用户集合
db.createCollection('users');

// 创建文档集合
db.createCollection('documents');

// 创建分类集合
db.createCollection('categories');

// 创建审核日志集合
db.createCollection('auditlogs');

// 插入默认分类
db.categories.insertMany([
  { name: '技术文档', description: '技术相关的文档', createdAt: new Date(), updatedAt: new Date() },
  { name: '产品设计', description: '产品设计相关的文档', createdAt: new Date(), updatedAt: new Date() },
  { name: '市场资料', description: '市场营销相关的文档', createdAt: new Date(), updatedAt: new Date() },
  { name: '规章制度', description: '公司规章制度文档', createdAt: new Date(), updatedAt: new Date() },
  { name: '培训资料', description: '培训和学习材料', createdAt: new Date(), updatedAt: new Date() }
]);

print('Database initialized successfully!');
