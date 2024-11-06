import pkg from 'pg';  // 使用默认导入
const { Client } = pkg;  // 获取 Client 类
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const client = new Client({
  connectionString: process.env.POSTGRES_URL,  // 确保数据库连接字符串正确
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

// 设置 multer 处理上传的图片
const upload = multer().single('image_file');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    if (req.body.image_file) {
      upload(req, res, async (err) => {
        if (err) {
          console.error('文件上传失败:', err);
          return res.status(500).json({ error: '文件上传失败' });
        }

        if (!req.file) {
          console.error('没有文件上传');
          return res.status(400).json({ error: '没有文件上传' });
        }

        // 查询数据库获取下一个可用的 API 密钥
        const { rows } = await client.query('SELECT * FROM api_key_usage ORDER BY last_used ASC LIMIT 1');
        if (rows.length === 0) {
          return res.status(500).json({ error: '没有可用的 API 密钥' });
        }

        const apiKey = rows[0].key_name;  // 获取当前最少使用的 API 密钥

        // 更新密钥使用情况
        await client.query('UPDATE api_key_usage SET usage_count = usage_count + 1, last_used = NOW() WHERE key_name = $1', [apiKey]);

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
              'X-Api-Key': process.env[apiKey],  // 从环境变量中获取密钥
              ...formData.getHeaders(),
            },
            body: formData,
          });

          if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`${response.status}: ${response.statusText} - ${errorMessage}`);
          }

          const buffer = await response.buffer();
          res.setHeader('Content-Type', 'image/png');
          res.send(buffer);
        } catch (error) {
          console.error('抠图失败:', error);
          res.status(500).json({ error: '抠图失败，请重试！', details: error.message });
        }
      });
    } else {
      return res.status(400).json({ error: '没有提供图片文件' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
