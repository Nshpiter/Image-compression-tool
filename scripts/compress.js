// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const controlPanel = document.getElementById('controlPanel');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalInfo = document.getElementById('originalInfo');
const compressedInfo = document.getElementById('compressedInfo');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');
const batchMode = document.getElementById('batchMode');

let currentFile = null;

// 处理拖拽事件
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#3498db';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#bdc3c7';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#bdc3c7';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// 处理点击上传
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// 处理文件上传
async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('文件大小不能超过10MB！');
        return;
    }

    currentFile = file;
    previewContainer.style.display = 'flex';
    controlPanel.style.display = 'block';

    // 显示原图
    const originalUrl = URL.createObjectURL(file);
    originalPreview.src = originalUrl;
    originalInfo.textContent = `文件大小: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    // 使用当前滑块值压缩图片
    await compressImage(file, qualitySlider.value / 100);
}

// 压缩图片
async function compressImage(file, quality) {
    try {
        // 创建图片对象
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });

        // 创建canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        // 绘制图片
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // 根据文件类型选择压缩格式
        let mimeType = 'image/jpeg';
        if (file.type === 'image/png' && quality === 1) {
            mimeType = 'image/png';
        }

        // 压缩图片
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, mimeType, quality);
        });

        if (!blob) {
            throw new Error('压缩失败');
        }

        const compressedUrl = URL.createObjectURL(blob);
        compressedPreview.src = compressedUrl;

        // 更新压缩信息
        const compressedSize = blob.size / (1024 * 1024);
        const savingsPercent = ((1 - blob.size / file.size) * 100).toFixed(1);
        
        if (quality === 1) {
            compressedInfo.textContent = `文件大小: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        } else {
            compressedInfo.textContent = `文件大小: ${compressedSize.toFixed(2)} MB (节省 ${savingsPercent}%)`;
        }

        // 更新下载按钮
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = compressedUrl;
            const extension = mimeType === 'image/png' ? '.png' : '.jpg';
            link.download = `compressed_${file.name.replace(/\.[^/.]+$/, '')}${extension}`;
            link.click();
        };

    } catch (error) {
        console.error('压缩失败:', error);
        alert('图片压缩失败，请重试');
    }
}

// 监听质量滑块变化
qualitySlider.addEventListener('input', (e) => {
    const quality = parseInt(e.target.value);
    qualityValue.textContent = quality + '%';
    
    if (currentFile) {
        compressImage(currentFile, quality / 100);
    }
});

// 清理内存
function cleanupMemory() {
    if (compressedPreview.src) {
        URL.revokeObjectURL(compressedPreview.src);
    }
    if (originalPreview.src) {
        URL.revokeObjectURL(originalPreview.src);
    }
}

window.addEventListener('beforeunload', cleanupMemory); 