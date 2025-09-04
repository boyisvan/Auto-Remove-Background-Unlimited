#!/usr/bin/env python3
"""
Python script để xóa background sử dụng rembg
Được gọi từ Node.js server
"""

import sys
import os
import json
from rembg import remove
from PIL import Image
import io

def remove_background(input_path, output_path=None):
    """
    Xóa background từ ảnh input và lưu kết quả
    
    Args:
        input_path (str): Đường dẫn file ảnh input
        output_path (str): Đường dẫn file ảnh output (optional)
    
    Returns:
        dict: Kết quả xử lý
    """
    try:
        # Đọc ảnh input
        with open(input_path, 'rb') as input_file:
            input_data = input_file.read()
        
        # Xóa background
        output_data = remove(input_data)
        
        # Tạo output path nếu không được cung cấp
        if not output_path:
            base_name = os.path.splitext(input_path)[0]
            output_path = f"{base_name}_no_bg.png"
        
        # Lưu kết quả
        with open(output_path, 'wb') as output_file:
            output_file.write(output_data)
        
        # Lấy thông tin ảnh
        input_image = Image.open(io.BytesIO(input_data))
        output_image = Image.open(io.BytesIO(output_data))
        
        result = {
            "success": True,
            "input_path": input_path,
            "output_path": output_path,
            "input_size": input_image.size,
            "output_size": output_image.size,
            "message": "Xóa background thành công"
        }
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Loi khi xoa background"
        }

def main():
    """
    Main function - xử lý arguments từ command line
    """
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Thieu tham so input file",
            "message": "Su dung: python remove_bg.py <input_file> [output_file]"
        }))
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Kiểm tra file input có tồn tại không
    if not os.path.exists(input_file):
        print(json.dumps({
            "success": False,
            "error": f"File khong ton tai: {input_file}",
            "message": "Vui long kiem tra duong dan file"
        }))
        sys.exit(1)
    
    # Xử lý xóa background
    result = remove_background(input_file, output_file)
    
    # In kết quả dưới dạng JSON
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
