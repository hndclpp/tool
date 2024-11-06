import pkg from 'pg';  // 使用默认导入
const { Client } = pkg;  // 获取 Client 类

const client = new Client({
  connectionString: process.env.POSTGRES_URL,  // 连接数据库
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const result = await client.query('SELECT * FROM api_key_usage ORDER BY last_used DESC LIMIT 3');

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '没有找到 API 密钥使用记录' });
      }

      return res.status(200).json({ data: result.rows });
    } catch (error) {
      console.error('查询失败:', error);
      return res.status(500).json({ error: '查询 API 使用情况失败' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
