import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const upload = multer().single('image_file');

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
                const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                    method: 'POST',
                    headers: {
                        'X-Api-Key': process.env.REMBG_API_KEY,
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
                res.status(666).json({ error: '抠图失败，请重试！', details: error.message });
            }
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
