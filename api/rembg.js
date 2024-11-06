import pkg from 'pg';  // 使用默认导入
const { Client } = pkg;  // 获取 Client 类
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const client = new Client({
  connectionString: process.env.POSTGRES_URL, // 连接数据库
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

// 设置 multer 处理上传的图片
const upload = multer().single('image_file');

// 获取下一个API密钥，轮流使用
async function getNextApiKey() {
  // 假设从环境变量中获取密钥列表
  const keys = [
    'REMBG_API_KEY_1',
    'REMBG_API_KEY_2',
    'REMBG_API_KEY_3',
  ];

  // 这里简单示例，轮流读取密钥（可以根据使用次数来动态调整选择）
  let keyIndex = new Date().getMinutes() % keys.length;  // 通过分钟数控制轮流
  return process.env[keys[keyIndex]];
}

// 更新数据库中使用的密钥
async function updateApiKeyUsage(keyName) {
  const query = `
    INSERT INTO api_key_usage (key_name, usage_count, last_used)
    VALUES ($1, 1, NOW())
    ON CONFLICT (key_name) 
    DO UPDATE SET usage_count = api_key_usage.usage_count + 1, last_used = NOW();
  `;
  await client.query(query, [keyName]);
}

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

        const formData = new FormData();
        formData.append('size', 'auto');
        formData.append('image_file', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });

        try {
          const apiKey = await getNextApiKey();
          console.log(`使用的API密钥: ${apiKey}`);

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

          // 更新数据库
          await updateApiKeyUsage(apiKey);

          res.setHeader('Content-Type', 'image/png');
          res.send(buffer);
        } catch (error) {
          console.error('抠图失败:', error);
          res.status(500).json({ error: '抠图失败，请重试！', details: error.message });
        }
      });
    } else {
      res.status(400).json({ error: '未提供图片文件' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
