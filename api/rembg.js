import pkg from 'pg';
const { Client } = pkg; 
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

client.connect();

// 设置 multer 处理上传的图片
const upload = multer().single('image_file');

// 获取下一个可用的API密钥
async function getNextApiKey() {
    const result = await client.query('SELECT * FROM api_key_usage ORDER BY last_used ASC LIMIT 1');
    
    if (result.rows.length === 0) {
        throw new Error('No API keys found in database');
    }

    const apiKey = result.rows[0];
    // 更新API密钥的使用次数和最后使用时间
    await client.query('UPDATE api_key_usage SET usage_count = usage_count + 1, last_used = NOW() WHERE key_name = $1', [apiKey.key_name]);
    
    return apiKey.key_name;
}

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
                const apiKey = await getNextApiKey(); // 获取下一个API密钥

                const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                    method: 'POST',
                    headers: {
                        'X-Api-Key': process.env[apiKey],
                        ...formData.getHeaders(),
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.statusText}`);
                }

                const buffer = await response.buffer();
                res.setHeader('Content-Type', 'image/png');
                res.send(buffer);
            } catch (error) {
                res.status(500).json({ error: `抠图失败: ${error.message}` });
            }
        });
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
