import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const upload = multer().single('image_file');

// 预设的 API 密钥列表
const apiKeys = [
    process.env.REMBG_API_KEY_1,
    process.env.REMBG_API_KEY_2,
    process.env.REMBG_API_KEY_3
];

let currentApiKeyIndex = 0; // 当前使用的 API 密钥索引

export default async function handler(req, res) {
    if (req.method === 'POST') {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(500).json({ error: '文件上传失败' });
            }

            if (!req.file) {
                return res.status(400).json({ error: '没有文件上传' });
            }

            const formData = new FormData();
            formData.append('size', 'auto');
            formData.append('image_file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
            });

            try {
                const response = await callRembgApi(formData);
                const buffer = await response.buffer();
                res.setHeader('Content-Type', 'image/png');
                res.send(buffer);
            } catch (error) {
                res.status(500).json({ error: '抠图失败，请重试！', details: error.message });
            }
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function callRembgApi(formData) {
    const apiKey = apiKeys[currentApiKeyIndex];

    // 切换到下一个密钥，轮流使用
    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
            'X-Api-Key': apiKey,
            ...formData.getHeaders(),
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error('API 调用失败');
    }

    return response;
}
