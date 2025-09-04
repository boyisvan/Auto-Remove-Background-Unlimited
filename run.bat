@echo off
chcp 65001 >nul
title Background Remover - Quick Start
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    Background Remover - Quick Start
echo ========================================
echo.

:: Kiểm tra Node.js
echo [1/3] Kiểm tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js chưa được cài đặt!
    echo Vui lòng cài đặt Node.js từ: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js OK
)

:: Kiểm tra Python
echo [2/3] Kiểm tra Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python chưa được cài đặt!
    echo Vui lòng cài đặt Python từ: https://python.org/
    pause
    exit /b 1
) else (
    echo ✅ Python OK
)

:: Kiểm tra package.json
if not exist "package.json" (
    echo ❌ Không tìm thấy package.json!
    pause
    exit /b 1
)

:: Cài đặt dependencies nếu thiếu
echo [3/3] Kiểm tra và cài đặt dependencies...
if not exist "node_modules" (
    echo Đang cài đặt Node.js dependencies...
    npm install
) else (
    echo ✅ Node.js dependencies OK
)

:: Cài đặt Python dependencies
python -c "import rembg" >nul 2>&1
if %errorlevel% neq 0 (
    echo Đang cài đặt Python dependencies...
    python -m pip install rembg onnxruntime
) else (
    echo ✅ Python dependencies OK
)

:: Tạo file .env nếu chưa có
if not exist ".env" (
    echo Tạo file .env mẫu...
    echo # DigitalOcean Spaces Configuration > .env
    echo DO_SPACES_KEY=your_spaces_key >> .env
    echo DO_SPACES_SECRET=your_spaces_secret >> .env
    echo DO_SPACES_BUCKET=your_bucket_name >> .env
    echo DO_REGION=nyc3 >> .env
    echo DO_ENDPOINT=nyc3.digitaloceanspaces.com >> .env
    echo REMOVE_BG_API_KEY= >> .env
)

:: Tạo thư mục cần thiết
if not exist "uploads" mkdir uploads
if not exist "results" mkdir results
if not exist "backgrounds" mkdir backgrounds

:: Khởi động server
echo.
echo ========================================
echo           KHỞI ĐỘNG SERVER
echo ========================================
echo.
echo Truy cập: http://localhost:3005
echo Quản lý ảnh nền: http://localhost:3005/background-manager.html
echo.
echo Đang mở trình duyệt...
echo Nhấn Ctrl+C để dừng server
echo.

:: Mở trình duyệt sau 3 giây
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3005"

npm start

echo.
echo Server đã dừng. Nhấn phím bất kỳ để thoát...
pause >nul