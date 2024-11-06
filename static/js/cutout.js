let uploadedFile;

document.getElementById('upload').addEventListener('change', (event) => {
    uploadedFile = event.target.files[0];
});

document.getElementById('processButton').addEventListener('click', async () => {
    const resultImage = document.getElementById('resultImage');
    const downloadButton = document.getElementById('downloadButton');
    const errorMessage = document.getElementById('errorMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (!uploadedFile) {
        errorMessage.textContent = '请先上传一张图片！';
        errorMessage.style.display = 'block';
        return;
    }

    // 重置界面状态
    resultImage.style.display = 'none';
    downloadButton.style.display = 'none';
    errorMessage.style.display = 'none';
    loadingSpinner.style.display = 'block';

    const formData = new FormData();
    formData.append('image_file', uploadedFile);

    try {
        const response = await fetch('/api/rembg', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorMessageText = await response.text(); 
            throw new Error(`抠图失败: ${errorMessageText}`);
        }

        const imgBlob = await response.blob();
        const imgURL = URL.createObjectURL(imgBlob);
        
        resultImage.src = imgURL;
        resultImage.style.display = 'block';
        downloadButton.style.display = 'block';
    } catch (error) {
        console.error('抠图失败:', error);
        errorMessage.textContent = '处理失败，请重试。';
        errorMessage.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }
});

// 处理下载按钮的点击事件
document.getElementById('downloadButton').addEventListener('click', () => {
    const resultImage = document.getElementById('resultImage');
    const link = document.createElement('a');
    link.href = resultImage.src;
    link.download = 'result.png';
    link.click();
});
