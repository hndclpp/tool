let convertedFiles = [];
function toggleInputMethod(method) {
    const uploadGroup = document.querySelector('.upload-group');
    const linkGroup = document.querySelector('.link-group');

    if (method === 'file') {
        uploadGroup.style.display = 'block';
        linkGroup.style.display = 'none';
    } else {
        uploadGroup.style.display = 'none';
        linkGroup.style.display = 'block';
    }
}

async function convertImage() {
    const fileInput = document.getElementById('image');
    const format = document.getElementById('format').value;

    if (!fileInput.files.length) {
        alert("请上传图片文件！");
        return;
    }

    convertedFiles = []; // 清空之前的转换结果

    const filePromises = Array.from(fileInput.files).map(async (file) => {
        const imageBitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        ctx.drawImage(imageBitmap, 0, 0);

        let blob;

        if (format === 'jpg' || format === 'png' || format === 'webp') {
            blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`));
        } else if (format === 'avif') {
            const squooshImage = await Squoosh.ImagePool();
            const img = squooshImage.ingestImage(file);
            await img.encode({ avif: {} });
            blob = await img.encodedWith.avif;
        } else if (format === 'ico') {
            const sizes = [16, 32, 48, 64];
            const images = await Promise.all(sizes.map(size => {
                const icoCanvas = document.createElement('canvas');
                icoCanvas.width = size;
                icoCanvas.height = size;
                const icoCtx = icoCanvas.getContext('2d');
                icoCtx.drawImage(imageBitmap, 0, 0, size, size);
                return new Promise(resolve => icoCanvas.toBlob(resolve, 'image/png'));
            }));

            const icoBlob = new Blob(images, { type: 'image/vnd.microsoft.icon' });
            blob = icoBlob;
        } else if (format === 'svg') {
            const svgBlob = new Blob([`
                <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                    <image href="${canvas.toDataURL('image/png')}" width="${canvas.width}" height="${canvas.height}"/>
                </svg>
            `], { type: 'image/svg+xml' });
            blob = svgBlob;
        } else if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            let width, height;
            if (imgWidth / imgHeight > pdfWidth / pdfHeight) {
                width = pdfWidth;
                height = (imgHeight * pdfWidth) / imgWidth;
            } else {
                height = pdfHeight;
                width = (imgWidth * pdfHeight) / imgHeight;
            }

            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
            blob = pdf.output('blob');
        }

        const url = URL.createObjectURL(blob);
        convertedFiles.push({ url, name: `converted_${file.name.split('.').slice(0, -1).join('.')}.${format}` });

        return { url, name: `converted_${file.name.split('.').slice(0, -1).join('.')}.${format}` };
    });

    const results = await Promise.all(filePromises);
    const resultDiv = document.querySelector('.result');
    resultDiv.innerHTML = ''; // 清空之前的结果

    results.forEach(file => {
        const imgElement = document.createElement('img');
        imgElement.src = file.url;
        imgElement.alt = "转换后的图片预览";
        resultDiv.appendChild(imgElement);

        const downloadLink = document.createElement('a');
        downloadLink.href = file.url;
        downloadLink.download = file.name;
        downloadLink.textContent = "下载 " + file.name;
        resultDiv.appendChild(downloadLink);
    });

    // 更新下载按钮的显示状态
    document.getElementById('zipButton').style.display = convertedFiles.length >= 2 ? 'inline' : 'none'; // 根据文件数量显示或隐藏
}

async function downloadZip() {
    const zip = new JSZip();

    for (const file of convertedFiles) {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(file.name, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_images.zip';
    a.click();
    URL.revokeObjectURL(url);
}

// 处理超链接图片
function addImageFromLink() {
    const imageLink = document.getElementById('imageLink').value;
    if (imageLink) {
        const fileInput = document.getElementById('image');
        const dataTransfer = new DataTransfer();

        // 创建一个新的 Image 对象
        const img = new window.Image(); // 使用 window.Image 确保在浏览器中执行
        img.crossOrigin = "Anonymous"; // 处理跨域问题
        img.src = imageLink;
        img.onload = function() {
            // 创建 Blob 对象
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(function(blob) {
                const file = new File([blob], 'image_from_link.' + getSelectedFormat(), {type: blob.type});
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
            }, 'image/png'); // 默认转换为 PNG
        };
        img.onerror = function() {
            alert("加载图片失败，请检查链接是否有效。");
        };
    } else {
        alert("请粘贴有效的图片链接！");
    }
}

function getSelectedFormat() {
    const formatSelect = document.getElementById('format');
    return formatSelect.options[formatSelect.selectedIndex].value;
}
