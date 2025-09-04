// Background Manager JavaScript
let backgrounds = [];
let currentEditingId = null;
let currentDeletingId = null;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const backgroundsContainer = document.getElementById('backgroundsContainer');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');
const editForm = document.getElementById('editForm');
const editName = document.getElementById('editName');
const confirmDelete = document.getElementById('confirmDelete');

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
editForm.addEventListener('submit', handleEditSubmit);
confirmDelete.addEventListener('click', handleDeleteConfirm);

// Drag and Drop handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFiles(Array.from(files));
    }
}

// File selection handler
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleFiles(files);
    }
}

// Handle multiple files
async function handleFiles(files) {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
        showNotification('Vui lòng chọn file ảnh hợp lệ!', 'error');
        return;
    }

    if (validFiles.length !== files.length) {
        showNotification(`Đã bỏ qua ${files.length - validFiles.length} file không hợp lệ`, 'warning');
    }

    // Upload files
    for (const file of validFiles) {
        await uploadBackground(file);
    }
}

// Upload background
async function uploadBackground(file) {
    try {
        const formData = new FormData();
        formData.append('background', file);

        const response = await fetch('/api/backgrounds/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`Đã thêm ảnh nền: ${result.filename}`, 'success');
            loadBackgrounds(); // Reload the list
        } else {
            showNotification(`Lỗi khi upload: ${result.error}`, 'error');
        }
    } catch (error) {
        showNotification(`Lỗi khi upload: ${error.message}`, 'error');
    }
}

// Load backgrounds
async function loadBackgrounds() {
    try {
        const response = await fetch('/api/backgrounds');
        backgrounds = await response.json();
        renderBackgrounds();
    } catch (error) {
        console.error('Error loading backgrounds:', error);
        backgroundsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Lỗi tải dữ liệu</h3>
                <p>Không thể tải danh sách ảnh nền</p>
            </div>
        `;
    }
}

// Render backgrounds
function renderBackgrounds() {
    if (backgrounds.length === 0) {
        backgroundsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>Chưa có ảnh nền nào</h3>
                <p>Hãy thêm ảnh nền đầu tiên của bạn</p>
            </div>
        `;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'backgrounds-grid';

    backgrounds.forEach(bg => {
        const card = document.createElement('div');
        card.className = 'background-card';
        card.innerHTML = `
            <div class="background-preview" style="background-image: url('/backgrounds/${bg.filename}')">
                <div class="background-actions">
                    <button class="action-btn btn-edit" onclick="editBackground('${bg.filename}')" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteBackground('${bg.filename}')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="background-info">
                <div class="background-name">${bg.name}</div>
                <div class="background-filename">${bg.filename}</div>
            </div>
        `;
        grid.appendChild(card);
    });

    backgroundsContainer.innerHTML = '';
    backgroundsContainer.appendChild(grid);
}

// Edit background
function editBackground(filename) {
    const background = backgrounds.find(bg => bg.filename === filename);
    if (!background) return;

    currentEditingId = filename;
    editName.value = background.name;
    editModal.style.display = 'block';
}

// Delete background
function deleteBackground(filename) {
    currentDeletingId = filename;
    deleteModal.style.display = 'block';
}

// Handle edit submit
async function handleEditSubmit(e) {
    e.preventDefault();
    
    if (!currentEditingId) return;

    try {
        const response = await fetch(`/api/backgrounds/${currentEditingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: editName.value
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Đã cập nhật tên ảnh nền', 'success');
            closeModal();
            loadBackgrounds();
        } else {
            showNotification(`Lỗi: ${result.error}`, 'error');
        }
    } catch (error) {
        showNotification(`Lỗi: ${error.message}`, 'error');
    }
}

// Handle delete confirm
async function handleDeleteConfirm() {
    if (!currentDeletingId) return;

    try {
        const response = await fetch(`/api/backgrounds/${currentDeletingId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Đã xóa ảnh nền', 'success');
            closeModal();
            loadBackgrounds();
        } else {
            showNotification(`Lỗi: ${result.error}`, 'error');
        }
    } catch (error) {
        showNotification(`Lỗi: ${error.message}`, 'error');
    }
}

// Close modal
function closeModal() {
    editModal.style.display = 'none';
    deleteModal.style.display = 'none';
    currentEditingId = null;
    currentDeletingId = null;
}

// Go back
function goBack() {
    window.location.href = '/';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === editModal) {
        closeModal();
    }
    if (event.target === deleteModal) {
        closeModal();
    }
});

// Load backgrounds on page load
document.addEventListener('DOMContentLoaded', function() {
    loadBackgrounds();
});
