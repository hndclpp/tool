document.getElementById('checkIpButton').onclick = function() {
    const ip = document.getElementById('ipInput').value;
    if (!ip) {
        document.getElementById('result').innerText = '请输入有效的 IP 地址';
        return;
    }

    fetch(`/.netlify/functions/ipLookup?ip=${ip}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络错误或无效的 IP 地址');
            }
            return response.json();
        })
        .then(data => {
            // 构建显示结果的 HTML
            const resultHtml = `
                <div>IP: ${data.ip}</div>
                <div>主机名: ${data.hostname}</div>
                <div>位置: ${data.city}, ${data.region}, ${data.country}</div>
                <div>经纬度: ${data.loc}</div>
                <div>时区: ${data.timezone}</div>
                <div>ISP: ${data.company.name} (${data.asn.name})</div>
                <div>ASN: ${data.asn.asn} (${data.asn.route})</div>
                <div>隐私保护: VPN - ${data.privacy.vpn ? '是' : '否'}, 代理 - ${data.privacy.proxy ? '是' : '否'}</div>
                <div>滥用联系: ${data.abuse.name} (${data.abuse.email})</div>
            `;
            document.getElementById('result').innerHTML = resultHtml;
        })
        .catch(error => {
            document.getElementById('result').innerText = '查询失败: ' + error.message;
        });
};
