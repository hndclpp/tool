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

    // 显示加载动画
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error-message').style.display = 'none'; // 隐藏错误信息
    document.getElementById('resultSection').style.display = 'none'; // 隐藏结果区
    document.getElementById('downloadButton').style.display = 'none'; // 隐藏下载按钮

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

        // 处理完成，显示结果和下载按钮
        document.getElementById('loading').style.display = 'none'; // 隐藏加载动画
        document.getElementById('resultSection').style.display = 'block'; // 显示结果区
        document.getElementById('downloadButton').style.display = 'inline-block'; // 显示下载按钮

    } catch (error) {
        // 处理失败，显示错误信息
        console.error('抠图失败:', error);
        document.getElementById('loading').style.display = 'none'; // 隐藏加载动画
        document.getElementById('error-message').style.display = 'block'; // 显示错误信息
    }
});
