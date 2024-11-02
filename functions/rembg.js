const fetch = require("node-fetch");
const FormData = require("form-data");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const blob = JSON.parse(event.body); // 从请求中获取图像文件

  try {
    const rbgResultData = await removeBg(blob);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
      },
      body: Buffer.from(rbgResultData).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

async function removeBg(blob) {
  const formData = new FormData();
  formData.append("size", "auto");
  formData.append("image_file", blob);

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": process.env.REMBG_API_KEY }, // 从环境变量中读取 API 密钥
    body: formData,
  });

  if (response.ok) {
    return await response.arrayBuffer();
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
}
