import { Client } from 'pg';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const upload = multer().single('image_file');

// 连接 PostgreSQL 数据库
const client = new Client({
    connectionString: process.env.POSTGRES_URL, 
    ssl: {
        rejectUnauthorized: false,  // 如果你使用 SSL 连接
    },
});

const apiKeys = [
    process.env.REMBG_API_KEY_1,
    process.env.REMBG_API_KEY_2,
    process.env.REMBG_API_KEY_3
];

let currentApiKeyIndex = 0;

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
                // 从数据库获取并更新 API 密钥使用次数
                const apiKey = await getNextApiKey();
                const response = await callRembgApi(formData, apiKey);
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

async function getNextApiKey() {
    // 获取当前 API 密钥的使用次数并选择下一个密钥
    await client.connect();
    const result = await client.query('SELECT * FROM api_usage ORDER BY key_id LIMIT 1');
    const currentApiKey = result.rows[0];

    // 更新使用次数
    await client.query('UPDATE api_usage SET usage_count = usage_count + 1 WHERE key_id = $1', [currentApiKey.key_id]);

    // 选择下一个 API 密钥
    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
    return apiKeys[currentApiKeyIndex];
}

async function callRembgApi(formData, apiKey) {
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
