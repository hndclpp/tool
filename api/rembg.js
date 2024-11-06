import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

// 配置 multer 用于文件上传
const upload = multer().single('image_file');

// 配置多个 API 密钥
const apiKeys = [
    process.env.REMBG_API_KEY_1, // 第一个 API 密钥
    process.env.REMBG_API_KEY_2, // 第二个 API 密钥
];

let currentApiKeyIndex = 0; // 当前使用的 API 密钥索引

export default async function handler(req, res) {
    if (req.method === 'POST') {
        upload(req, res, async (err) => {
            if (err) {
                console.error('文件上传失败:', err);
                return res.status(500).json({ error: '文件上传失败' });
            }

            if (!req.file) {
                console.error('没有文件上传');
                return res.status(400).json({ error: '没有文件上传' });
            }

            const formData = new FormData();
            formData.append('size', 'auto');
            formData.append('image_file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
            });

            try {
                // 调用 remove.bg API 处理图像
                const response = await callRembgApi(formData);

                const buffer = await response.buffer();
                res.setHeader('Content-Type', 'image/png');
                res.send(buffer);
            } catch (error) {
                console.error('抠图失败:', error);
                res.status(500).json({ error: '抠图失败，请重试！', details: error.message });
            }
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// 轮流使用不同的 API 密钥
async function callRembgApi(formData) {
    let apiKey = apiKeys[currentApiKeyIndex];  // 使用当前索引的 API 密钥

    // 打印当前正在使用的密钥的环境变量名称
    const apiKeyEnvVar = `REMBG_API_KEY_${currentApiKeyIndex + 1}`;
    console.log(`正在使用的 API 密钥：${apiKeyEnvVar}`);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
            'X-Api-Key': apiKey,
            ...formData.getHeaders(),
        },
        body: formData,
    });

    // 如果当前密钥超出限制或失败，切换到下一个密钥
    if (!response.ok) {
        currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;  // 轮流使用密钥
        console.log(`使用密钥失败，正在尝试下一个密钥：REMBG_API_KEY_${currentApiKeyIndex + 1}`);
        throw new Error(`使用密钥失败，正在尝试下一个密钥。`);
    }

    return response;
}
