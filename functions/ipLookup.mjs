import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export const handler = async (event) => {
    const ip = event.queryStringParameters.ip;
    const token = process.env.IPINFO_TOKEN;

    if (!ip) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: '缺少 IP 地址' }),
        };
    }

    try {
        const response = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`);
        const data = await response.json();

        return {
            statusCode: response.ok ? 200 : response.status,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '查询失败' }),
        };
    }
};
