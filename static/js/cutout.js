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
    document.getElementById('error-message').style.display = 'none'; 
    document.getElementById('resultSection').style.display = 'none'; 
    document.getElementById('downloadButton').style.display = 'none'; 

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

        const fileName = uploadedFile.name.replace(/\.[^/.]+$/, "") + ".png"; // 强制将扩展名改为 .png

        // 处理下载按钮的点击事件
        document.getElementById('downloadButton').onclick = function() {
            const link = document.createElement('a');
            link.href = imgURL;
            link.download = fileName;
            link.click(); // 触发下载
        };

    } catch (error) {
        document.getElementById('loading').style.display = 'none'; 
        document.getElementById('error-message').style.display = 'block'; 
    }
});

document.getElementById('checkButton').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('查询API使用情况失败');
        }

        const data = await response.json();
        const usageTable = document.getElementById('usageTable');
        usageTable.innerHTML = ''; // 清空当前表格内容

        data.data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${row.key_name}</td><td>${row.usage_count}</td><td>${row.last_used}</td>`;
            usageTable.appendChild(tr);
        });
    } catch (error) {
        console.error('查询失败:', error);
    }
});
