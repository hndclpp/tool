let uploadedFile;

document.getElementById('upload').addEventListener('change', (event) => {
    uploadedFile = event.target.files[0];
});

document.getElementById('processButton').addEventListener('click', async () => {
    if (!uploadedFile) {
        alert('请先上传一张图片！');
        return;
    }

    const formData = new FormData();
    formData.append('image_file', uploadedFile);

try {
    const response = await fetch('/api/rembg', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorMessage = await response.text(); 
        throw new Error(`抠图失败: ${errorMessage}`);
    }

    const imgBlob = await response.blob();
    const imgURL = URL.createObjectURL(imgBlob);
    const resultImage = document.getElementById('resultImage');
    resultImage.src = imgURL;
    resultImage.style.display = 'block';
} catch (error) {
    console.error('抠图失败:', error);
}
});
