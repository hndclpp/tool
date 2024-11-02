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
            const resultHtml = `
                <div>IP: <span class="variable">${data.ip}</span>,</div>
                <div>主机名: <span class="variable">${data.hostname || '未知'}</span>,</div>
                <div>城市: <span class="variable">${data.city}</span>,</div>
                <div>区域: <span class="variable">${data.region}</span>,</div>
                <div>国家: <span class="variable">${data.country}</span>,</div>
                <div>地理位置: <span class="variable">${data.loc}</span>,</div>
                <div>组织: <span class="variable">${data.asn.asn} ${data.asn.name}</span>,</div>
                <div>邮政编码: <span class="variable">${data.postal}</span>,</div>
                <div>时区: <span class="variable">${data.timezone}</span>,</div>
                <div>ASN: {</div>
                <div>&nbsp;&nbsp;ASN: <span class="variable">${data.asn.asn}</span>,</div>
                <div>&nbsp;&nbsp;名称: <span class="variable">${data.asn.name}</span>,</div>
                <div>&nbsp;&nbsp;域名: <span class="variable">${data.asn.domain}</span>,</div>
                <div>&nbsp;&nbsp;路由: <span class="variable">${data.asn.route}</span>,</div>
                <div>&nbsp;&nbsp;类型: <span class="variable">${data.asn.type}</span></div>
                <div>}</div>
                <div>公司: {</div>
                <div>&nbsp;&nbsp;名称: <span class="variable">${data.company.name}</span>,</div>
                <div>&nbsp;&nbsp;域名: <span class="variable">${data.company.domain}</span>,</div>
                <div>&nbsp;&nbsp;类型: <span class="variable">${data.company.type}</span></div>
                <div>}</div>
                <div>隐私: {</div>
                <div>&nbsp;&nbsp;VPN: <span class="variable">${data.privacy.vpn}</span>,</div>
                <div>&nbsp;&nbsp;代理: <span class="variable">${data.privacy.proxy}</span>,</div>
                <div>&nbsp;&nbsp;Tor: <span class="variable">${data.privacy.tor}</span>,</div>
                <div>&nbsp;&nbsp;中继: <span class="variable">${data.privacy.relay}</span>,</div>
                <div>&nbsp;&nbsp;托管: <span class="variable">${data.privacy.hosting}</span></div>
                <div>}</div>
                <div>滥用报告: {</div>
                <div>&nbsp;&nbsp;地址: <span class="variable">${data.abuse.address}</span>,</div>
                <div>&nbsp;&nbsp;国家: <span class="variable">${data.abuse.country}</span>,</div>
                <div>&nbsp;&nbsp;邮箱: <span class="variable">${data.abuse.email}</span>,</div>
                <div>&nbsp;&nbsp;名称: <span class="variable">${data.abuse.name}</span>,</div>
                <div>&nbsp;&nbsp;电话: <span class="variable">${data.abuse.phone}</span></div>
                <div>}</div>
            `;

            document.getElementById('result').innerHTML = resultHtml;
        })
        .catch(error => {
            document.getElementById('result').innerText = '查询失败: ' + error.message;
        });
};
