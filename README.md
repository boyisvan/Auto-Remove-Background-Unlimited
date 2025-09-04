# Background Remover - Ứng Dụng Xóa Background Từ Ảnh

Ứng dụng web hiện đại để xóa background từ ảnh sử dụng AI rembg (Python) với giao diện đẹp và dễ sử dụng. Hỗ trợ chọn ảnh nền tùy chỉnh và upload lên DigitalOcean Spaces.

## Tính Năng

- **Xóa background không giới hạn**: Sử dụng rembg (Python AI) thay vì API có giới hạn
- **Chọn ảnh nền tùy chỉnh**: Ghép ảnh đã xóa background với ảnh nền có sẵn
- **Upload từ file hoặc URL**: Hỗ trợ cả upload file và xử lý từ URL
- **Quản lý ảnh nền đầy đủ**: Thêm, sửa, xóa ảnh nền qua giao diện web
- **Upload lên DigitalOcean Spaces**: Tự động upload kết quả lên cloud
- **Giao diện responsive**: Hoạt động tốt trên mọi thiết bị
- **Hiệu ứng typewriter**: Subtitle với hiệu ứng đánh chữ đẹp mắt
- **Xử lý batch URL**: Xử lý nhiều URL cùng lúc với thanh tiến trình

## Cài Đặt Nhanh

### Windows
```bash
# Chỉ cần double-click vào file:
run.bat
```

### Linux/Mac
```bash
# Chạy lệnh sau:
./run.sh
```

File script sẽ tự động:
- Kiểm tra Node.js và Python
- Cài đặt tất cả dependencies
- Tạo file cấu hình
- Tạo ảnh nền mẫu
- Khởi động server

## Cài Đặt Thủ Công

### Yêu Cầu Hệ Thống
- Node.js (phiên bản 14 trở lên)
- Python 3 (để chạy rembg)
- npm hoặc yarn

### Bước 1: Clone Repository
```bash
git clone <repository-url>
cd background-remover
```

### Bước 2: Cài Đặt Dependencies
```bash
# Cài đặt Node.js dependencies
npm install

# Cài đặt Python dependencies
pip install rembg onnxruntime
```

### Bước 3: Cấu Hình
1. Tạo file `.env` từ file `env.example`:
```bash
cp env.example .env
```

2. Cập nhật cấu hình trong file `.env`:
```env
# DigitalOcean Spaces Configuration (tùy chọn)
DO_SPACES_KEY=your_spaces_key
DO_SPACES_SECRET=your_spaces_secret
DO_SPACES_BUCKET=your_bucket_name
DO_REGION=nyc3
DO_ENDPOINT=nyc3.digitaloceanspaces.com

# Remove.bg API Key (không cần thiết vì dùng rembg)
REMOVE_BG_API_KEY=
```

### Bước 4: Khởi Chạy Ứng Dụng
```bash
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3005`

## Cách Sử Dụng

### 1. Upload Ảnh
- **Kéo thả**: Kéo file ảnh từ máy tính vào vùng upload
- **Click để chọn**: Click vào vùng upload để mở hộp thoại chọn file
- **Upload từ URL**: Dán link ảnh vào ô textarea (hỗ trợ nhiều URL)

### 2. Chọn Ảnh Nền
- Chọn từ danh sách ảnh nền có sẵn
- Tùy chọn "Không nền" để giữ ảnh transparent
- Ảnh nền sẽ được ghép với ảnh đã xóa background

### 3. Xử Lý Ảnh
- Click nút "Xóa Watermark" hoặc "Xóa Watermark từ URL"
- Theo dõi tiến trình xử lý qua thanh progress
- Ảnh sẽ được xử lý bằng AI rembg (không giới hạn)

### 4. Xem Kết Quả
- Kết quả sẽ hiển thị với ảnh nền đã chọn
- Click "Xem ảnh" để mở link DigitalOcean Spaces
- Click "Ảnh mới" để xử lý ảnh khác

### 5. Quản Lý Ảnh Nền
- Click "Quản lý ảnh nền" ở footer
- Upload ảnh nền mới (drag & drop)
- Chỉnh sửa tên hiển thị
- Xóa ảnh nền không cần thiết

## Cấu Trúc Dự Án

```
background-remover/
├── public/                          # Frontend files
│   ├── index.html                   # Giao diện chính
│   ├── background-manager.html      # Trang quản lý ảnh nền
│   ├── background-manager.js        # JavaScript cho trang quản lý
│   ├── styles.css                   # CSS styles
│   └── script.js                    # JavaScript logic
├── backgrounds/                     # Thư mục chứa ảnh nền
│   ├── README.md                    # Hướng dẫn sử dụng
│   ├── white-background.jpg         # Ảnh nền mẫu
│   ├── blue-gradient.jpg
│   ├── green-nature.jpg
│   ├── black-background.jpg
│   └── pink-background.jpg
├── uploads/                         # Thư mục chứa file upload tạm
├── results/                         # Thư mục chứa kết quả xử lý
├── remove_bg.py                     # Python script xử lý xóa background
├── server.js                        # Backend server
├── run.bat                          # Script chạy nhanh cho Windows
├── run.sh                           # Script chạy nhanh cho Linux/Mac
├── package.json                     # Dependencies
├── env.example                      # Template cấu hình
└── README.md                        # Hướng dẫn này
```

## API Endpoints

### Background Management
- **GET `/api/backgrounds`**: Lấy danh sách ảnh nền
- **POST `/api/backgrounds/upload`**: Upload ảnh nền mới
- **PUT `/api/backgrounds/:filename`**: Cập nhật tên ảnh nền
- **DELETE `/api/backgrounds/:filename`**: Xóa ảnh nền

### Image Processing
- **POST `/api/remove-watermark`**: Xóa background từ file upload
- **POST `/api/remove-watermark-url`**: Xóa background từ URL

### File Management
- **GET `/api/download/:filename`**: Tải xuống file kết quả
- **GET `/api/results`**: Lấy danh sách các file kết quả
- **DELETE `/api/cleanup`**: Dọn dẹp file cũ

## Cấu Hình

### Environment Variables
- `DO_SPACES_KEY`: DigitalOcean Spaces access key (tùy chọn)
- `DO_SPACES_SECRET`: DigitalOcean Spaces secret key (tùy chọn)
- `DO_SPACES_BUCKET`: Tên bucket DigitalOcean Spaces (tùy chọn)
- `DO_REGION`: Region của DigitalOcean Spaces (mặc định: nyc3)
- `DO_ENDPOINT`: Endpoint của DigitalOcean Spaces (mặc định: nyc3.digitaloceanspaces.com)
- `REMOVE_BG_API_KEY`: API key từ Remove.bg (không cần thiết)
- `PORT`: Port để chạy server (mặc định: 3005)

### Giới Hạn File
- **Kích thước tối đa**: 10MB
- **Định dạng hỗ trợ**: JPG, PNG, WEBP
- **Số lượng file**: 1 file mỗi lần xử lý (upload)
- **Số lượng URL**: Không giới hạn (xử lý tuần tự)

## Ưu Điểm So Với Remove.bg API

| Tính năng | Remove.bg API | rembg (Local) |
|-----------|---------------|---------------|
| **Giới hạn** | 50 ảnh/tháng (free) | Không giới hạn |
| **Bảo mật** | Gửi ảnh lên server | Xử lý local |
| **Tốc độ** | Phụ thuộc mạng | Nhanh hơn |
| **Chi phí** | Có phí cho plan cao | Hoàn toàn miễn phí |
| **Tùy chỉnh** | Không thể | Nhiều model AI |

## Xử Lý Lỗi

### Lỗi Thường Gặp

1. **"Python chưa được cài đặt"**
   - Cài đặt Python 3 từ python.org
   - Đảm bảo Python được thêm vào PATH

2. **"rembg chưa được cài đặt"**
   - Chạy: `pip install rembg onnxruntime`
   - Hoặc chạy lại file `run.bat`/`run.sh`

3. **"File quá lớn"**
   - Giảm kích thước ảnh xuống dưới 10MB
   - Sử dụng công cụ nén ảnh

4. **"Lỗi xử lý ảnh"**
   - Kiểm tra định dạng ảnh có hợp lệ
   - Thử với ảnh khác
   - Kiểm tra log trong terminal

5. **"Không thể upload lên DigitalOcean"**
   - Kiểm tra cấu hình trong file `.env`
   - Đảm bảo credentials đúng
   - Kiểm tra quyền truy cập bucket

## Bảo Mật

- File upload được lưu tạm và tự động xóa sau khi xử lý
- Chỉ chấp nhận file ảnh với MIME type hợp lệ
- Giới hạn kích thước file để tránh tấn công
- Xử lý ảnh hoàn toàn local, không gửi dữ liệu ra ngoài
- API keys được lưu trong environment variables

## Responsive Design

Ứng dụng được thiết kế để hoạt động tốt trên:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (480px - 767px)
- Small Mobile (< 480px)

## Tính Năng UI/UX

- **Drag & Drop**: Kéo thả file trực quan
- **Progress Bar**: Hiển thị tiến trình xử lý
- **Typewriter Effect**: Hiệu ứng đánh chữ cho subtitle
- **Background Preview**: Xem trước ảnh nền
- **Modal Dialogs**: Popup để chỉnh sửa và xác nhận
- **Custom Scrollbar**: Thanh cuộn đẹp mắt
- **Animations**: Chuyển động mượt mà
- **Error Handling**: Thông báo lỗi rõ ràng
- **Keyboard Shortcuts**: Enter để xử lý, Esc để reset
- **Touch Support**: Hỗ trợ thiết bị cảm ứng

## Demo
**Giao diện trang chủ**
<img width="1115" height="915" alt="image" src="https://github.com/user-attachments/assets/44480c94-06ce-44e6-9472-b3842a829f82" />


## Deployment

### Heroku
```bash
# Tạo app Heroku
heroku create your-app-name

# Set environment variables
heroku config:set DO_SPACES_KEY=your_key
heroku config:set DO_SPACES_SECRET=your_secret
heroku config:set DO_SPACES_BUCKET=your_bucket

# Deploy
git push heroku main
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build image
docker build -t background-remover .

# Run container
docker run -p 3005:3005 -e DO_SPACES_KEY=your_key background-remover
```

## Đóng Góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## License

Dự án này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## Hỗ Trợ

Nếu gặp vấn đề hoặc có câu hỏi:
- Tạo issue trên GitHub
- Liên hệ trực tiếp với tác giả

## Liên Hệ Tác Giả

**ducvancoder**
- **Số điện thoại & Zalo**: 0587282880
- **Email**: ducvan05102002@gmail.com

## Cảm Ơn

- [rembg](https://github.com/danielgatis/rembg) - Thư viện Python xóa background
- [Sharp](https://sharp.pixelplumbing.com/) - Thư viện xử lý ảnh Node.js
- [Font Awesome](https://fontawesome.com/) - Icons
- Cộng đồng open source

---

**Lưu ý**: Ứng dụng sử dụng rembg (Python AI) để xử lý ảnh local, không cần API key và không có giới hạn số lượng ảnh xử lý.
