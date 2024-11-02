import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export const handler = async (event) => {
console.log('请求事件:', event);
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const body = JSON.parse(event.body); // 解析请求体
    const base64Image = body.image; // 获取 base64 图像
    const apiKey = process.env.REMBG_API_KEY;

    // 打印 API 密钥
    console.log('REMBG_API_KEY:', apiKey);

    if (!base64Image) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: '缺少图像数据' }),
        };
    }

    try {
        // 调用处理图像的 API（请根据实际情况调整）
        const response = await fetch('https://api.rembg.com/v1/removebg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey,
            },
            body: JSON.stringify({ image: base64Image }),
        });

       const result = await response.json();
console.log('Rembg API 响应:', result);


        if (!response.ok) {
            throw new Error(result.error || '处理失败');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ image: result.image }), // 返回处理后的图像
        };
    } catch (error) {
        console.error('错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '处理失败' }),
        };
    }
};
