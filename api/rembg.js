import pkg from 'pg';
const { Client } = pkg;
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

// 使用 multer 处理文件上传
const upload = multer().single('image_file');

// 创建 PostgreSQL 客户端实例
const client = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // 这里设置为 false，允许不完全认证的连接
  },
});

client.connect();

// 后端处理函数
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
        // 获取轮流使用的 API 密钥
        const apiKey = await getApiKey();
        
        // 调用 Rembg API 进行抠图操作
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': apiKey,
            ...formData.getHeaders(),
          },
          body: formData,
        });

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`${response.status}: ${response.statusText} - ${errorMessage}`);
        }

        const buffer = await response.buffer();

        // 返回抠图后的图片
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

// 获取轮流使用的 API 密钥
async function getApiKey() {
  const keyIndex = await getNextKeyIndex();

  // 通过索引获取对应的 API 密钥
  const apiKey = process.env[`REMBG_API_KEY_${keyIndex}`];

  // 更新密钥的使用次数
  await updateApiKeyUsage(keyIndex);

  return apiKey;
}

// 获取下一个轮流使用的密钥索引
async function getNextKeyIndex() {
  const query = 'SELECT * FROM key_usage ORDER BY last_used_at LIMIT 1';
  const result = await client.query(query);

  let keyIndex = 1;  // 默认使用第一个密钥

  if (result.rows.length > 0) {
    // 选择使用次数最少的密钥
    keyIndex = (result.rows[0].key_index % 3) + 1;
  }

  return keyIndex;
}

// 更新指定密钥的使用次数
async function updateApiKeyUsage(keyIndex) {
  const query = `
    INSERT INTO key_usage (key_index, usage_count, last_used_at)
    VALUES ($1, 1, NOW())
    ON CONFLICT (key_index)
    DO UPDATE SET usage_count = key_usage.usage_count + 1, last_used_at = NOW();
  `;

  await client.query(query, [keyIndex]);
}
