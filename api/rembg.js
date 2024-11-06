import { Client } from 'pg';
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
              'X-Api-Key': process.env.REMBG_API_KEY, // 轮流使用密钥的逻辑可以放在这里
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
    } 
    // 处理查询API密钥使用情况请求
    else if (req.body.checkUsage) {
      try {
        const result = await client.query('SELECT * FROM api_key_usage');
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: '没有找到 API 密钥使用记录' });
        }
        
        return res.status(200).json({ data: result.rows });
      } catch (error) {
        console.error('数据库查询失败:', error);
        return res.status(500).json({ error: '数据库查询失败' });
      }
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
