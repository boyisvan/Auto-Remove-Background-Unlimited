const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// DigitalOcean Spaces Configuration
const DO_SPACES_KEY = process.env.DO_SPACES_KEY || "DO00PYQ2B3NAQ63B3B36";
const DO_SPACES_SECRET = process.env.DO_SPACES_SECRET || "6V1HZnLmvHna+r2tBWvm+1Oczg0TyFQAyOIXbvHmcpw";
const DO_SPACES_BUCKET = process.env.DO_SPACES_BUCKET || "trumpany123";
const REGION = process.env.DO_REGION || "nyc3";
const ENDPOINT = process.env.DO_ENDPOINT || "nyc3.digitaloceanspaces.com";

// S3 (DO Spaces) Client
const s3 = new AWS.S3({
  accessKeyId: DO_SPACES_KEY,
  secretAccessKey: DO_SPACES_SECRET,
  endpoint: new AWS.Endpoint(ENDPOINT),
  region: REGION,
});

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, 'uploads');
const resultsDir = path.join(__dirname, 'results');
const backgroundsDir = path.join(__dirname, 'backgrounds');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(resultsDir);
fs.ensureDirSync(backgroundsDir);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/backgrounds', express.static(backgroundsDir));

// Set UTF-8 encoding for responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Cấu hình multer để upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  },
  fileFilter: function (req, file, cb) {
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload file ảnh!'), false);
    }
  }
});

// Utility functions
function slugifyName(name) {
  return (name || "image")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\-_.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadBufferToSpaces(buffer, originalBaseName) {
  const safeBase = slugifyName(originalBaseName || "image");
  const fileName = `${Date.now()}-${safeBase}.webp`;

  const params = {
    Bucket: DO_SPACES_BUCKET,
    Key: fileName,
    Body: buffer,
    ACL: "public-read",
    ContentType: "image/webp",
    ContentDisposition: "inline",
  };
  await s3.upload(params).promise();
  return `https://${DO_SPACES_BUCKET}.${ENDPOINT}/${fileName}`;
}

async function convertAnyToWebpBuffer(inputBuffer) {
  return sharp(inputBuffer).webp().toBuffer();
}

async function removeBackgroundWithRembg(inputPath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'remove_bg.py');
    const outputPath = inputPath.replace(/\.[^/.]+$/, '_no_bg.png');
    
    // Gọi Python script
    const python = spawn('python', [pythonScript, inputPath, outputPath]);
    
    let stdout = '';
    let stderr = '';
    
    // Timeout sau 60 giây
    const timeout = setTimeout(() => {
      python.kill('SIGTERM');
      reject(new Error('Timeout: Python script chạy quá lâu (>60s)'));
    }, 60000);
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      clearTimeout(timeout);
      
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          if (result.success) {
            // Kiểm tra file output có tồn tại không
            if (fs.existsSync(outputPath)) {
              resolve(outputPath);
            } else {
              reject(new Error('File output không được tạo'));
            }
          } else {
            reject(new Error(result.error || 'Lỗi xóa background'));
          }
        } catch (parseError) {
          reject(new Error('Lỗi parse kết quả từ Python script'));
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });
    
    python.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Không thể chạy Python script: ${error.message}`));
    });
  });
}

async function compositeImageWithBackground(foregroundBuffer, backgroundPath, outputFormat = 'webp') {
  try {
    let pipeline = sharp(foregroundBuffer);
    
    // Get foreground dimensions
    const { width: fgWidth, height: fgHeight } = await pipeline.metadata();
    
    if (backgroundPath && backgroundPath !== 'none' && fs.existsSync(backgroundPath)) {
      // Load background image
      const backgroundBuffer = fs.readFileSync(backgroundPath);
      const background = sharp(backgroundBuffer);
      
      // Get background dimensions
      const { width: bgWidth, height: bgHeight } = await background.metadata();
      
      // Calculate scaling to fit foreground on background
      const scale = Math.min(bgWidth / fgWidth, bgHeight / fgHeight);
      const newFgWidth = Math.round(fgWidth * scale);
      const newFgHeight = Math.round(fgHeight * scale);
      
      // Resize foreground to fit background
      const resizedForeground = await pipeline
        .resize(newFgWidth, newFgHeight)
        .png()
        .toBuffer();
      
      // Composite foreground on background
      const result = await background
        .composite([{
          input: resizedForeground,
          gravity: 'center'
        }])
        .webp()
        .toBuffer();
      
      return result;
    } else {
      // No background, just convert to webp
      return await pipeline.webp().toBuffer();
    }
  } catch (error) {
    console.error('Error compositing image:', error);
    throw error;
  }
}

async function fetchImageAsBuffer(url, timeoutMs = 30000, maxBytes = 30 * 1024 * 1024) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: timeoutMs,
      maxContentLength: maxBytes,
      maxBodyLength: maxBytes,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.data || response.data.length === 0) {
      throw new Error('Ảnh tải về rỗng');
    }
    
    return Buffer.from(response.data);
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new Error('URL không tồn tại hoặc không thể kết nối');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout khi tải ảnh');
    } else if (error.response) {
      throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    } else {
      throw new Error(`Không thể tải ảnh từ URL: ${error.message}`);
    }
  }
}

function inferBaseNameFromUrl(url) {
  try {
    const p = new URL(url);
    const base = path.basename(p.pathname) || "image";
    return base.replace(/\.[^/.]+$/, "");
  } catch {
    return "image";
  }
}

// API endpoint để lấy danh sách ảnh nền
app.get('/api/backgrounds', (req, res) => {
  try {
    const files = fs.readdirSync(backgroundsDir);
    const backgrounds = files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map(filename => {
        const name = filename
          .replace(/\.(jpg|jpeg|png|webp)$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        return {
          filename,
          name,
          url: `/backgrounds/${filename}`
        };
      });
    
    res.json(backgrounds);
  } catch (error) {
    console.error('Error reading backgrounds:', error);
    res.status(500).json({ error: 'Lỗi khi đọc danh sách ảnh nền' });
  }
});

// API endpoint để upload ảnh nền mới
app.post('/api/backgrounds/upload', upload.single('background'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file nào được upload' });
    }

    const tempPath = req.file.path;
    const filename = req.file.originalname;
    const finalPath = path.join(backgroundsDir, filename);

    // Kiểm tra file đã tồn tại chưa
    if (fs.existsSync(finalPath)) {
      fs.removeSync(tempPath);
      return res.status(400).json({ error: 'File đã tồn tại' });
    }

    // Di chuyển file từ temp sang thư mục backgrounds
    fs.moveSync(tempPath, finalPath);

    res.json({
      success: true,
      message: 'Upload ảnh nền thành công',
      filename: filename
    });

  } catch (error) {
    console.error('Error uploading background:', error);
    
    // Xóa file temp nếu có lỗi
    if (req.file) {
      fs.removeSync(req.file.path);
    }

    res.status(500).json({
      error: 'Lỗi khi upload ảnh nền',
      details: error.message
    });
  }
});

// API endpoint để cập nhật tên ảnh nền
app.put('/api/backgrounds/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Thiếu tên mới' });
    }

    // Trong thực tế, chúng ta chỉ có thể cập nhật metadata
    // Vì không thể đổi tên file mà không ảnh hưởng đến URL
    res.json({
      success: true,
      message: 'Cập nhật thành công',
      filename: filename,
      name: name
    });

  } catch (error) {
    console.error('Error updating background:', error);
    res.status(500).json({
      error: 'Lỗi khi cập nhật ảnh nền',
      details: error.message
    });
  }
});

// API endpoint để xóa ảnh nền
app.delete('/api/backgrounds/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(backgroundsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File không tồn tại' });
    }

    // Xóa file
    fs.removeSync(filePath);

    res.json({
      success: true,
      message: 'Xóa ảnh nền thành công',
      filename: filename
    });

  } catch (error) {
    console.error('Error deleting background:', error);
    res.status(500).json({
      error: 'Lỗi khi xóa ảnh nền',
      details: error.message
    });
  }
});

// API endpoint để xóa watermark
app.post('/api/remove-watermark', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file nào được upload' });
    }

    const imagePath = req.file.path;
    
    // Sử dụng rembg để xóa background
    const noBgPath = await removeBackgroundWithRembg(imagePath);
    
    // Đọc ảnh đã xóa background
    const noBgBuffer = fs.readFileSync(noBgPath);

    // Lấy thông tin ảnh nền được chọn
    const selectedBackground = req.body.background || 'none';
    const backgroundPath = selectedBackground !== 'none' 
      ? path.join(backgroundsDir, selectedBackground)
      : null;
    
    // Ghép ảnh với nền được chọn và chuyển đổi sang WebP
    const finalBuffer = await compositeImageWithBackground(noBgBuffer, backgroundPath);
    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const doUrl = await uploadBufferToSpaces(finalBuffer, baseName);

    // Xóa file tạm
    fs.removeSync(imagePath);
    fs.removeSync(noBgPath);

    res.json({
      success: true,
      message: 'Xóa background và upload thành công!',
      originalFile: req.file.originalname,
      doUrl: doUrl,
      downloadUrl: doUrl
    });

  } catch (error) {
    console.error('Lỗi:', error);
    
    // Xóa file upload nếu có lỗi
    if (req.file) {
      fs.removeSync(req.file.path);
    }

    res.status(500).json({
      error: 'Co loi xay ra khi xu ly anh',
      details: error.message
    });
  }
});

// API endpoint để xóa watermark từ URL
app.post('/api/remove-watermark-url', async (req, res) => {
  let tempPath = null;
  let noBgPath = null;
  
  try {
    const { url, background = 'none' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Thieu URL anh' });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({ error: 'URL khong hop le' });
    }
    
    // Check if URL is an image
    if (!url.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i)) {
      // URL might not be an image, but continue processing
    }

    // Tải ảnh từ URL với timeout
    const imageBuffer = await fetchImageAsBuffer(url, 30000, 20 * 1024 * 1024);
    
    // Lưu ảnh tạm
    tempPath = path.join(uploadsDir, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, imageBuffer);
    
    // Sử dụng rembg để xóa background
    noBgPath = await removeBackgroundWithRembg(tempPath);
    
    // Đọc ảnh đã xóa background
    const noBgBuffer = fs.readFileSync(noBgPath);

    // Lấy thông tin ảnh nền được chọn
    const backgroundPath = background !== 'none' 
      ? path.join(backgroundsDir, background)
      : null;
    
    // Ghép ảnh với nền được chọn và chuyển đổi sang WebP
    const finalBuffer = await compositeImageWithBackground(noBgBuffer, backgroundPath);
    const baseName = inferBaseNameFromUrl(url);
    const doUrl = await uploadBufferToSpaces(finalBuffer, baseName);

    // Xóa file tạm
    if (tempPath && fs.existsSync(tempPath)) {
      fs.removeSync(tempPath);
    }
    if (noBgPath && fs.existsSync(noBgPath)) {
      fs.removeSync(noBgPath);
    }

    res.json({
      success: true,
      message: 'Xóa background từ URL thành công!',
      originalUrl: url,
      doUrl: doUrl,
      downloadUrl: doUrl
    });

  } catch (error) {
    console.error('Lỗi xử lý URL:', error.message);
    
    // Xóa file tạm nếu có lỗi
    try {
      if (tempPath && fs.existsSync(tempPath)) {
        fs.removeSync(tempPath);
      }
      if (noBgPath && fs.existsSync(noBgPath)) {
        fs.removeSync(noBgPath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    res.status(500).json({
      error: 'Co loi xay ra khi xu ly anh tu URL',
      details: error.message
    });
  }
});

// API endpoint để download kết quả
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(resultsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        res.status(500).json({ error: 'Lỗi khi download file' });
      }
    });
  } else {
    res.status(404).json({ error: 'File không tồn tại' });
  }
});

// API endpoint để lấy danh sách kết quả
app.get('/api/results', (req, res) => {
  try {
    const files = fs.readdirSync(resultsDir);
    const results = files.map(filename => ({
      filename,
      downloadUrl: `/api/download/${filename}`,
      createdAt: fs.statSync(path.join(resultsDir, filename)).mtime
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi đọc danh sách kết quả' });
  }
});

// Xóa file kết quả cũ (giữ lại 10 file gần nhất)
app.delete('/api/cleanup', (req, res) => {
  try {
    const files = fs.readdirSync(resultsDir);
    if (files.length > 10) {
      const sortedFiles = files
        .map(filename => ({
          filename,
          mtime: fs.statSync(path.join(resultsDir, filename)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      const filesToDelete = sortedFiles.slice(10);
      filesToDelete.forEach(file => {
        fs.removeSync(path.join(resultsDir, file.filename));
      });
      
      res.json({ 
        message: `Đã xóa ${filesToDelete.length} file cũ`,
        deletedFiles: filesToDelete.map(f => f.filename)
      });
    } else {
      res.json({ message: 'Không cần dọn dẹp' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi dọn dẹp file' });
  }
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`~ by dvancoder`);
});

// Xử lý lỗi unhandled
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
