const multer = require('multer');
const path = require('path');
const config = require('../config');

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 创建 multer 实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  }
});

// 单文件上传中间件
const uploadSingle = upload.single('file');

// 错误处理包装器
const handleUploadError = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.message === 'File too large' ? '文件大小超出限制' : '文件上传错误'
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || '文件上传错误'
      });
    }
    next();
  });
};

module.exports = {
  upload,
  uploadSingle: handleUploadError
};
