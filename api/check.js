import { Client } from 'pg';

const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

client.connect();

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const result = await client.query('SELECT * FROM api_key_usage ORDER BY last_used DESC LIMIT 3');
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: '没有API使用记录' });
            }
            
            return res.status(200).json(result.rows);
        } catch (error) {
            return res.status(500).json({ error: '查询失败', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
