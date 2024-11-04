import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // 加载 .env 文件

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 设置 multer 用于处理文件上传
const upload = multer();

// 设置静态文件服务
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'cutout/index.html'));
});

app.post('/api/remove-background', upload.single('image_file'), async (req, res) => {
    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
    });

    try {
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': process.env.REMBG_API_KEY, // 从环境变量获取 API 密钥
                ...formData.getHeaders(), // 添加 FormData 的 Headers
            },
            body: formData,
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`${response.status}: ${response.statusText} - ${errorMessage}`);
        }

        const buffer = await response.buffer();
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        console.error('抠图失败:', error);
        res.status(500).send('抠图失败，请重试！');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
