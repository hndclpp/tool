import fetch from 'node-fetch';

let apiKeyIndex = 0;
const apiKeys = [
    process.env.REMBG_API_KEY_1,
    process.env.REMBG_API_KEY_2,
    process.env.REMBG_API_KEY_3
];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const apiKey = apiKeys[apiKeyIndex];
    apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;

    const response = await fetch('https://api.rembg.io/v1/remove', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: req.body
    });

    if (!response.ok) {
        res.status(500).json({ error: 'Background removal failed' });
        return;
    }

    const blob = await response.blob();
    res.setHeader('Content-Type', 'image/png');
    blob.stream().pipe(res);
}
