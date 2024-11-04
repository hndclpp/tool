
    <script>
        const fileInput = document.getElementById('fileInput');
        const uploadButton = document.getElementById('uploadButton');
        const resultDiv = document.getElementById('result');

        uploadButton.addEventListener('click', async () => {
            const file = fileInput.files[0];
            if (!file) {
                alert('请选择一个文件');
                return;
            }

            const reader = new FileReader();
            reader.onload = async () => {
                const base64Image = reader.result.split(',')[1];

                try {
                    const response = await fetch('/.netlify/functions/rembg', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ image: base64Image }),
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP错误: ${response.status}`);
                    }

                    const result = await response.json();
                    resultDiv.innerHTML = `<img src="data:image/png;base64,${result.image}" />`;
                } catch (error) {
                    console.error('发生错误:', error);
                    resultDiv.textContent = '处理失败';
                }
            };

            reader.readAsDataURL(file);
        });
