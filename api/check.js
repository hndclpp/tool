import pkg from 'pg';  // 使用默认导入
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 查询数据库中的 API 密钥使用情况
    try {
      const result = await client.query('SELECT * FROM api_key_usage ORDER BY last_used DESC LIMIT 3');
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '没有找到 API 密钥使用记录' });
      }

      return res.status(200).json({ data: result.rows });
    } catch (error) {
      console.error('查询 API 使用情况失败:', error);
      return res.status(500).json({ error: '查询 API 使用情况失败', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
