import pkg from 'pg';  // 使用默认导入
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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 处理抠图请求
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

        try {
          // 查询数据库中 API 密钥使用情况
          const result = await client.query('SELECT * FROM api_key_usage ORDER BY last_used ASC LIMIT 1');
          if (result.rows.length === 0) {
            return res.status(500).json({ error: '没有可用的 API 密钥' });
          }

          // 获取下一个可用的 API 密钥
          const nextApiKey = result.rows[0].key_name;

          // 请求抠图 API
          const formData = new FormData();
          formData.append('size', 'auto');
          formData.append('image_file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
          });

          const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
              'X-Api-Key': process.env[nextApiKey], // 通过环境变量读取对应的 API 密钥
              ...formData.getHeaders(),
            },
            body: formData,
          });

          if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`${response.status}: ${response.statusText} - ${errorMessage}`);
          }

          // 获取图片数据并返回
          const buffer = await response.buffer();

          // 更新数据库中 API 密钥的使用情况
          const updateResult = await client.query(
            'UPDATE api_key_usage SET usage_count = usage_count + 1, last_used = NOW() WHERE key_name = $1',
            [nextApiKey]
          );

          // 返回处理后的图片
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
