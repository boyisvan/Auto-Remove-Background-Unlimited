// CSV Upload functionality
let csvData = [];
let selectedBackground = 'none';
let availableBackgrounds = [];
let processedResults = [];

// DOM Elements
const csvInput = document.getElementById('csvInput');
const csvUploadArea = document.querySelector('.csv-upload-area');
const csvPreview = document.getElementById('csvPreview');
const csvTableBody = document.getElementById('csvTableBody');
const processBtn = document.getElementById('processBtn');
const csvProgress = document.getElementById('csvProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const csvResults = document.getElementById('csvResults');
const downloadBtn = document.getElementById('downloadBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Event Listeners
csvUploadArea.addEventListener('dragover', handleDragOver);
csvUploadArea.addEventListener('dragleave', handleDragLeave);
csvUploadArea.addEventListener('drop', handleDrop);

// Background selection
document.addEventListener('click', function(e) {
    if (e.target.closest('.background-option')) {
        const option = e.target.closest('.background-option');
        selectBackground(option.dataset.background);
    }
});

// Drag and Drop handlers
function handleDragOver(e) {
    e.preventDefault();
    csvUploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    csvUploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    csvUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
        handleCSVFile(files[0]);
    } else {
        showError('Vui lòng chọn file CSV hợp lệ!');
    }
}

// Handle CSV file upload
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handleCSVFile(file);
    }
}

function handleCSVFile(file) {
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
        showError('Vui lòng chọn file CSV hợp lệ!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            parseCSV(e.target.result);
        } catch (error) {
            showError('Lỗi khi đọc file CSV: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
        showError('File CSV phải có ít nhất 2 dòng (header + data)!');
        return;
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim());
    
    if (!header.includes('Images')) {
        showError('File CSV phải có cột "Images"!');
        return;
    }

    // Parse data
    csvData = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Handle quoted CSV fields
        const row = parseCSVRow(line);
        
        if (row.length > 0 && row[0]) {
            // Clean up URLs - remove quotes and trim
            const images = row[0].replace(/^["']|["']$/g, '').trim();
            const processed = (row[1] || '').replace(/^["']|["']$/g, '').trim();
            
            csvData.push({
                images: images,
                processed: processed
            });
        }
    }

    if (csvData.length === 0) {
        showError('Không có dữ liệu hợp lệ trong file CSV!');
        return;
    }

    showCSVPreview();
    hideError();
    showSuccess(`Đã tải ${csvData.length} dòng dữ liệu từ CSV!`);
}

// Parse CSV row handling quotes properly
function parseCSVRow(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add last field
    result.push(current);
    
    return result;
}

// Show CSV preview
function showCSVPreview() {
    csvTableBody.innerHTML = '';
    
    csvData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="csv-urls">${row.images}</td>
            <td class="csv-urls">${row.processed || 'Chưa xử lý'}</td>
        `;
        csvTableBody.appendChild(tr);
    });
    
    csvPreview.style.display = 'block';
}

// Background selection
function selectBackground(background) {
    selectedBackground = background;
    
    document.querySelectorAll('#backgroundOptions .background-option').forEach(option => {
        option.classList.remove('active');
    });
    
    document.querySelector(`#backgroundOptions [data-background="${background}"]`).classList.add('active');
}

// Load available backgrounds
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
}

// Process CSV
async function processCSV() {
    if (csvData.length === 0) {
        showError('Không có dữ liệu để xử lý!');
        return;
    }

    try {
        showProgress();
        processedResults = [];
        
        let completed = 0;
        const total = csvData.length;
        
        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const imageUrls = row.images.split(',').map(url => url.trim()).filter(url => url);
            
            const processedUrls = [];
            
            for (const url of imageUrls) {
                try {
                    const response = await fetch('/api/remove-watermark-url', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            url: url, 
                            background: selectedBackground 
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        processedUrls.push(result.doUrl);
                    } else {
                        processedUrls.push(`ERROR: ${result.error || 'Unknown error'}`);
                    }
                } catch (error) {
                    processedUrls.push(`ERROR: ${error.message || 'Network error'}`);
                }
            }
            
            processedResults.push({
                images: row.images,
                processed: processedUrls.join(',')
            });
            
            completed++;
            const progress = Math.round((completed / total) * 100);
            updateProgress(progress, `Đã xử lý ${completed}/${total} dòng`);
        }
        
        showResults();
        
    } catch (error) {
        console.error('Error processing CSV:', error);
        showError('Lỗi khi xử lý CSV: ' + error.message);
        hideProgress();
    }
}

// Show progress
function showProgress() {
    csvPreview.style.display = 'none';
    csvProgress.style.display = 'block';
    processBtn.disabled = true;
    updateProgress(0, 'Đang chuẩn bị...');
}

// Update progress
function updateProgress(percent, text) {
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
}

// Hide progress
function hideProgress() {
    csvProgress.style.display = 'none';
    processBtn.disabled = false;
}

// Show results
function showResults() {
    hideProgress();
    csvResults.style.display = 'block';
    showSuccess('Đã xử lý xong tất cả ảnh!');
}

// Download sample CSV
function downloadSampleCSV() {
    // Create sample CSV content with proper formatting
    const sampleContent = `Images,Processed Image
"https://example.com/single-image.jpg",
"https://example.com/image1.jpg,https://example.com/image2.jpg"`;

    // Create and download file
    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_images.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Đã tải xuống file CSV mẫu!');
}

// Download results
function downloadResults() {
    if (processedResults.length === 0) {
        showError('Không có kết quả để tải xuống!');
        return;
    }

    // Create CSV content
    let csvContent = 'Images,Processed Image\n';
    processedResults.forEach(row => {
        csvContent += `"${row.images}","${row.processed}"\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `processed_images_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Đã tải xuống file CSV kết quả!');
}

// Utility functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadBackgrounds();
});
