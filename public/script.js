// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const previewImg = document.getElementById('previewImg');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const btnRemove = document.getElementById('btnRemove');
const btnProcess = document.getElementById('btnProcess');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const resultSection = document.getElementById('resultSection');
const resultImg = document.getElementById('resultImg');
const btnDownload = document.getElementById('btnDownload');
const btnNew = document.getElementById('btnNew');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const btnRetry = document.getElementById('btnRetry');

// URL processing elements
const urlsInput = document.getElementById('urlsInput');
const uploadUrlsBtn = document.getElementById('uploadUrlsBtn');
const urlProgressFill = document.getElementById('urlProgressFill');
const urlProgressText = document.getElementById('urlProgressText');
const urlProgressPercent = document.getElementById('urlProgressPercent');
const urlResultsContent = document.getElementById('urlResultsContent');

// Global variables
let currentFile = null;
let currentResult = null;
let selectedBackground = 'none';
let selectedUrlBackground = 'none';
let availableBackgrounds = [];

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
btnRemove.addEventListener('click', removeFile);
btnProcess.addEventListener('click', processImage);
btnDownload.addEventListener('click', downloadResult);
btnNew.addEventListener('click', resetApp);
btnRetry.addEventListener('click', retryProcess);

// URL processing event listeners
uploadUrlsBtn.addEventListener('click', processUrls);

// Clear results button
const btnClearResults = document.getElementById('btnClearResults');
btnClearResults.addEventListener('click', clearUrlResults);

// Background selection event listeners
document.addEventListener('click', function(e) {
    if (e.target.closest('.background-option')) {
        const option = e.target.closest('.background-option');
        const container = option.closest('.background-options');
        
        if (container.id === 'urlBackgroundOptions') {
            selectUrlBackground(option.dataset.background);
        } else {
            selectBackground(option.dataset.background);
        }
    }
});

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
        handleFile(files[0]);
    }
}

// File selection handler
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// File handling
function handleFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Vui lòng chọn file ảnh hợp lệ!');
        return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.');
        return;
    }

    currentFile = file;
    displayFilePreview(file);
}

// Display file preview
function displayFilePreview(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        
        uploadArea.style.display = 'none';
        uploadPreview.style.display = 'block';
        
        hideAllSections();
    };
    
    reader.readAsDataURL(file);
}

// Remove file
function removeFile() {
    currentFile = null;
    fileInput.value = '';
    
    uploadPreview.style.display = 'none';
        uploadArea.style.display = 'block';
    
    hideAllSections();
}

// Process image
async function processImage() {
    if (!currentFile) return;
    
    try {
        // Show progress
        showProgress();
        
        // Create FormData
        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('background', selectedBackground);
        
        // Simulate progress
        simulateProgress();
        
        // Send request
        const response = await fetch('/api/remove-watermark', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentResult = result;
            showResult(result);
        } else {
            throw new Error(result.error || 'Có lỗi xảy ra');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Có lỗi xảy ra khi xử lý ảnh');
    }
}

// Simulate progress
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
            progress = 90;
            clearInterval(interval);
        }
        updateProgress(progress);
    }, 200);
}

// Update progress
function updateProgress(percent) {
    progressFill.style.width = percent + '%';
    progressPercent.textContent = Math.round(percent) + '%';
    
    if (percent >= 90) {
        progressText.textContent = 'Hoàn thành...';
    }
}

// Show progress section
function showProgress() {
    hideAllSections();
    progressSection.style.display = 'block';
    btnProcess.disabled = true;
    btnProcess.classList.add('processing');
}

// Show result section
function showResult(result) {
    hideAllSections();
    
    // Load result image from DigitalOcean
    resultImg.src = result.doUrl;
    
    // Update download button
    btnDownload.href = result.doUrl;
    
    resultSection.style.display = 'block';
    btnProcess.disabled = false;
    btnProcess.classList.remove('processing');
}

// Show error section
function showError(message) {
    hideAllSections();
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    btnProcess.disabled = false;
    btnProcess.classList.remove('processing');
}

// Hide all sections
function hideAllSections() {
    progressSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
}

// Download result
function downloadResult() {
    if (currentResult) {
        const link = document.createElement('a');
        link.href = currentResult.downloadUrl;
        link.download = `watermark-removed-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Reset app
function resetApp() {
    currentFile = null;
    currentResult = null;
    fileInput.value = '';
    
    uploadPreview.style.display = 'none';
    uploadArea.style.display = 'block';
    
    hideAllSections();
}

// Retry process
function retryProcess() {
    if (currentFile) {
        processImage();
    }
}

// Process URLs
async function processUrls() {
    const lines = urlsInput.value.split('\n').map(s => s.trim()).filter(Boolean);
    if (!lines.length) {
        alert('Vui lòng dán ít nhất 1 URL ảnh');
        return;
    }

    // Clear previous results
    urlResultsContent.innerHTML = '';
    urlProgressFill.style.width = '0%';
    urlProgressPercent.textContent = '0%';
    urlProgressText.textContent = 'Đang xử lý...';
    uploadUrlsBtn.disabled = true;
    
    let done = 0;
    const total = lines.length;
    
    // Add results counter
    const resultsHeader = document.querySelector('.results-header h4');
    resultsHeader.textContent = `Kết quả xử lý (0/${total})`;

    for (const url of lines) {
        try {
            const response = await fetch('/api/remove-watermark-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url, background: selectedUrlBackground })
            });

            const result = await response.json();

            if (result.success) {
                const div = document.createElement('div');
                div.className = 'result-item';
                div.innerHTML = `<a href="${result.doUrl}" target="_blank">${result.doUrl}</a>`;
                urlResultsContent.appendChild(div);
            } else {
                const div = document.createElement('div');
                div.className = 'result-item error';
                div.textContent = `Lỗi: ${result.error || 'Không rõ'}`;
                urlResultsContent.appendChild(div);
            }
        } catch (error) {
            const div = document.createElement('div');
            div.className = 'result-item error';
            div.textContent = `Lỗi: ${error.message}`;
            urlResultsContent.appendChild(div);
        } finally {
            done += 1;
            const pct = Math.round(done * 100 / total);
            urlProgressFill.style.width = pct + '%';
            urlProgressPercent.textContent = pct + '%';
            
            // Update results counter
            const resultsHeader = document.querySelector('.results-header h4');
            resultsHeader.textContent = `Kết quả xử lý (${done}/${total})`;
            
            // Auto scroll to bottom
            urlResultsContent.scrollTop = urlResultsContent.scrollHeight;
        }
    }

    urlProgressText.textContent = 'Hoàn thành';
    uploadUrlsBtn.disabled = false;
}

// Clear URL results
function clearUrlResults() {
    urlResultsContent.innerHTML = '<p class="empty-state">Chưa có kết quả nào</p>';
    const resultsHeader = document.querySelector('.results-header h4');
    resultsHeader.textContent = 'Kết quả xử lý';
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Typewriter effect
function typewriterEffect() {
    const subtitle = document.getElementById('typewriterSubtitle');
    const text = 'Xóa watermark từ ảnh và upload lên DigitalOcean';
    let index = 0;
    
    function typeChar() {
        if (index < text.length) {
            subtitle.innerHTML = text.substring(0, index + 1) + '<span class="typewriter-cursor"></span>';
            index++;
            setTimeout(typeChar, 50); // Tốc độ đánh chữ (ms)
        } else {
            // Hoàn thành, chờ 5 giây rồi xóa và bắt đầu lại
            setTimeout(() => {
                eraseText();
            }, 5000);
        }
    }
    
    function eraseText() {
        if (index > 0) {
            subtitle.innerHTML = text.substring(0, index - 1) + '<span class="typewriter-cursor"></span>';
            index--;
            setTimeout(eraseText, 50); // Tốc độ xóa nhanh hơn
        } else {
            // Xóa xong, chờ 1 giây rồi bắt đầu lại
            setTimeout(() => {
                typeChar();
            }, 1000);
        }
    }
    
    // Bắt đầu hiệu ứng
    typeChar();
}

// Add some visual feedback for better UX
document.addEventListener('DOMContentLoaded', function() {
    // Load available backgrounds
    loadBackgrounds();
    
    // Start typewriter effect
    typewriterEffect();
    // Add loading state to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }
        });
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && currentFile && !btnProcess.disabled) {
            processImage();
        }
        if (e.key === 'Escape') {
            resetApp();
        }
    });
    
    // Add file input change event for better UX
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            this.blur(); // Remove focus for better UX
        }
    });
});

// Add touch support for mobile devices
if ('ontouchstart' in window) {
    uploadArea.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.98)';
    });
    
    uploadArea.addEventListener('touchend', function() {
        this.style.transform = '';
    });
}

// Add error handling for network issues
window.addEventListener('online', function() {
    if (currentFile && !btnProcess.disabled) {
        btnProcess.disabled = false;
    }
});

window.addEventListener('offline', function() {
    if (currentFile) {
        btnProcess.disabled = true;
        showError('Không có kết nối internet. Vui lòng kiểm tra kết nối và thử lại.');
    }
});

// Add file validation feedback
function validateFile(file) {
    const errors = [];
    
    if (!file.type.startsWith('image/')) {
        errors.push('File phải là ảnh');
    }
    
    if (file.size > 10 * 1024 * 1024) {
        errors.push('File quá lớn (tối đa 10MB)');
    }
    
    return errors;
}

// Add success notification
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Background selection functions
function selectBackground(background) {
    selectedBackground = background;
    
    // Update UI for file upload section
    document.querySelectorAll('#backgroundOptions .background-option').forEach(option => {
        option.classList.remove('active');
    });
    
    document.querySelector(`#backgroundOptions [data-background="${background}"]`).classList.add('active');
}

function selectUrlBackground(background) {
    selectedUrlBackground = background;
    
    // Update UI for URL section
    document.querySelectorAll('#urlBackgroundOptions .background-option').forEach(option => {
        option.classList.remove('active');
    });
    
    document.querySelector(`#urlBackgroundOptions [data-background="${background}"]`).classList.add('active');
}

async function loadBackgrounds() {
    try {
        const response = await fetch('/api/backgrounds');
        const backgrounds = await response.json();
        availableBackgrounds = backgrounds;
        renderBackgroundOptions(backgrounds);
    } catch (error) {
        console.error('Error loading backgrounds:', error);
    }
}

function renderBackgroundOptions(backgrounds) {
    // Render for file upload section
    const container = document.getElementById('backgroundOptions');
    const noBackgroundOption = container.querySelector('[data-background="none"]');
    container.innerHTML = '';
    container.appendChild(noBackgroundOption);
    
    backgrounds.forEach(bg => {
        const option = document.createElement('div');
        option.className = 'background-option';
        option.dataset.background = bg.filename;
        
        option.innerHTML = `
            <div class="bg-preview" style="background-image: url('/backgrounds/${bg.filename}')"></div>
            <span>${bg.name}</span>
        `;
        
        container.appendChild(option);
    });
    
    // Render for URL section
    const urlContainer = document.getElementById('urlBackgroundOptions');
    const urlNoBackgroundOption = urlContainer.querySelector('[data-background="none"]');
    urlContainer.innerHTML = '';
    urlContainer.appendChild(urlNoBackgroundOption);
    
    backgrounds.forEach(bg => {
        const option = document.createElement('div');
        option.className = 'background-option';
        option.dataset.background = bg.filename;
        
        option.innerHTML = `
            <div class="bg-preview" style="background-image: url('/backgrounds/${bg.filename}')"></div>
            <span>${bg.name}</span>
        `;
        
        urlContainer.appendChild(option);
    });
}

// Add CSS animations for notifications
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
