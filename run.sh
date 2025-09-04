#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "    Background Remover - Auto Setup"
echo "========================================"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
echo -e "${BLUE}[1/6]${NC} Kiểm tra Node.js..."
if ! command_exists node; then
    echo -e "${RED}❌ Node.js chưa được cài đặt!${NC}"
    echo ""
    echo "Vui lòng cài đặt Node.js từ: https://nodejs.org/"
    echo "Hoặc sử dụng package manager:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  CentOS/RHEL: sudo yum install nodejs npm"
    echo "  macOS: brew install node"
    echo ""
    exit 1
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js đã cài đặt: $NODE_VERSION${NC}"
fi

# Check Python
echo ""
echo -e "${BLUE}[2/6]${NC} Kiểm tra Python..."
if ! command_exists python3 && ! command_exists python; then
    echo -e "${RED}❌ Python chưa được cài đặt!${NC}"
    echo ""
    echo "Vui lòng cài đặt Python từ: https://python.org/"
    echo "Hoặc sử dụng package manager:"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "  CentOS/RHEL: sudo yum install python3 python3-pip"
    echo "  macOS: brew install python"
    echo ""
    exit 1
else
    if command_exists python3; then
        PYTHON_CMD="python3"
        PYTHON_VERSION=$(python3 --version)
    else
        PYTHON_CMD="python"
        PYTHON_VERSION=$(python --version)
    fi
    echo -e "${GREEN}✅ Python đã cài đặt: $PYTHON_VERSION${NC}"
fi

# Check package.json
echo ""
echo -e "${BLUE}[3/6]${NC} Kiểm tra package.json..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Không tìm thấy package.json!${NC}"
    echo "Vui lòng chạy script này trong thư mục dự án."
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Tìm thấy package.json${NC}"
fi

# Install Node.js dependencies
echo ""
echo -e "${BLUE}[4/6]${NC} Cài đặt Node.js dependencies..."
echo "Đang cài đặt các thư viện Node.js..."
if ! npm install; then
    echo -e "${RED}❌ Lỗi khi cài đặt Node.js dependencies!${NC}"
    echo ""
    echo "Thử chạy lệnh sau:"
    echo "npm install"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Node.js dependencies đã được cài đặt${NC}"
fi

# Install Python dependencies
echo ""
echo -e "${BLUE}[5/6]${NC} Cài đặt Python dependencies..."
echo "Đang cài đặt rembg và onnxruntime..."
if ! $PYTHON_CMD -m pip install rembg onnxruntime; then
    echo -e "${RED}❌ Lỗi khi cài đặt Python dependencies!${NC}"
    echo ""
    echo "Thử chạy lệnh sau:"
    echo "$PYTHON_CMD -m pip install rembg onnxruntime"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Python dependencies đã được cài đặt${NC}"
fi

# Check .env file
echo ""
echo -e "${BLUE}[6/6]${NC} Kiểm tra cấu hình..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Không tìm thấy file .env${NC}"
    echo ""
    echo "Tạo file .env từ env.example..."
    if [ -f "env.example" ]; then
        cp "env.example" ".env"
        echo -e "${GREEN}✅ Đã tạo file .env từ env.example${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  VUI LÒNG CHỈNH SỬA FILE .env:${NC}"
        echo "   - Thêm REMOVE_BG_API_KEY (nếu có)"
        echo "   - Cấu hình DigitalOcean Spaces (nếu cần)"
        echo ""
    else
        echo -e "${RED}❌ Không tìm thấy env.example!${NC}"
        echo "Tạo file .env mặc định..."
        cat > .env << EOF
# DigitalOcean Spaces Configuration
DO_SPACES_KEY=your_spaces_key
DO_SPACES_SECRET=your_spaces_secret
DO_SPACES_BUCKET=your_bucket_name
DO_REGION=nyc3
DO_ENDPOINT=nyc3.digitaloceanspaces.com
# Remove.bg API Key (optional - using rembg instead)
REMOVE_BG_API_KEY=
EOF
        echo ""
        echo -e "${GREEN}✅ Đã tạo file .env mặc định${NC}"
        echo -e "${YELLOW}⚠️  VUI LÒNG CHỈNH SỬA FILE .env với thông tin của bạn!${NC}"
        echo ""
    fi
else
    echo -e "${GREEN}✅ Tìm thấy file .env${NC}"
fi

# Create necessary directories
echo ""
echo "Tạo thư mục cần thiết..."
mkdir -p uploads results backgrounds
echo -e "${GREEN}✅ Đã tạo các thư mục cần thiết${NC}"

# Check sample backgrounds
echo ""
echo "Kiểm tra ảnh nền mẫu..."
bg_count=$(find backgrounds -name "*.jpg" -o -name "*.png" -o -name "*.webp" | wc -l)
if [ $bg_count -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Chưa có ảnh nền nào trong thư mục backgrounds/${NC}"
    echo ""
    echo "Tạo ảnh nền mẫu..."
    $PYTHON_CMD -c "
import os
from PIL import Image, ImageDraw

def create_sample_bg(name, color, size=(1920, 1080)):
    img = Image.new('RGB', size, color)
    draw = ImageDraw.Draw(img)
    # Thêm text
    try:
        draw.text((size[0]//2-100, size[1]//2), name, fill='white' if sum(color) < 400 else 'black')
    except:
        pass
    img.save(f'backgrounds/{name}.jpg', 'JPEG', quality=95)

# Tạo ảnh nền mẫu
create_sample_bg('white-background', (255, 255, 255))
create_sample_bg('blue-gradient', (74, 144, 226))
create_sample_bg('green-nature', (46, 204, 113))
create_sample_bg('black-background', (0, 0, 0))
create_sample_bg('pink-background', (255, 182, 193))
print('✅ Đã tạo 5 ảnh nền mẫu')
" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Không thể tạo ảnh nền mẫu tự động${NC}"
        echo "Bạn có thể thêm ảnh nền vào thư mục backgrounds/ sau"
    else
        echo -e "${GREEN}✅ Đã tạo 5 ảnh nền mẫu${NC}"
    fi
else
    echo -e "${GREEN}✅ Tìm thấy $bg_count ảnh nền${NC}"
fi

# Setup complete
echo ""
echo -e "${GREEN}"
echo "========================================"
echo "           SETUP HOÀN TẤT!"
echo "========================================"
echo -e "${NC}"
echo ""
echo -e "${GREEN}✅ Tất cả dependencies đã được cài đặt${NC}"
echo -e "${GREEN}✅ Cấu hình đã được kiểm tra${NC}"
echo -e "${GREEN}✅ Thư mục đã được tạo${NC}"
echo ""
echo -e "${BLUE}🚀 Đang khởi động Background Remover...${NC}"
echo ""
echo -e "${BLUE}📱 Truy cập: http://localhost:3005${NC}"
echo -e "${BLUE}🛠️  Quản lý ảnh nền: http://localhost:3005/background-manager.html${NC}"
echo ""
echo -e "${YELLOW}💡 Nhấn Ctrl+C để dừng server${NC}"
echo ""

# Start server
npm start

# If server stops, show message
echo ""
echo -e "${GREEN}"
echo "========================================"
echo "        SERVER ĐÃ DỪNG"
echo "========================================"
echo -e "${NC}"
echo ""
echo "Cảm ơn bạn đã sử dụng Background Remover!"
echo ""
