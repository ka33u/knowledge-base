const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base';

async function seed() {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ email: 'admin@knowledge-base.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // 创建管理员账户
    const admin = new User({
      username: 'admin',
      email: 'admin@knowledge-base.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@knowledge-base.com');
    console.log('Password: Admin@123');
    console.log('Please change the password after first login!');

    // 创建示例编辑账户
    const editor = new User({
      username: 'editor',
      email: 'editor@knowledge-base.com',
      password: 'Editor@123',
      role: 'editor',
      isActive: true
    });

    await editor.save();
    console.log('Editor user created successfully');
    console.log('Email: editor@knowledge-base.com');
    console.log('Password: Editor@123');

    // 创建示例普通用户
    const user = new User({
      username: 'user',
      email: 'user@knowledge-base.com',
      password: 'User@123',
      role: 'user',
      isActive: true
    });

    await user.save();
    console.log('User created successfully');
    console.log('Email: user@knowledge-base.com');
    console.log('Password: User@123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
