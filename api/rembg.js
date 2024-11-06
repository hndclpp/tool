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
        // 从环境变量中获取 API 密钥，并通过它访问 Rembg API
        const apiKey = process.env[`REMBG_API_KEY_${getRandomInt(1, 3)}`];

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

        // 保存结果到数据库
        const query = 'INSERT INTO image_results (image_data) VALUES ($1)';
        await client.query(query, [buffer]);

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

// 获取一个随机的 API 密钥（1 或 2）
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
