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
                <div>ip: "${data.ip}",</div>
                <div>city: "${data.city}",</div>
                <div>region: "${data.region}",</div>
                <div>country: "${data.country}",</div>
                <div>loc: "${data.loc}",</div>
                <div>org: "${data.org}",</div>
                <div>postal: "${data.postal}",</div>
                <div>timezone: "${data.timezone}",</div>
                <div>asn: {</div>
                <div>&nbsp;&nbsp;asn: "${data.asn.asn}",</div>
                <div>&nbsp;&nbsp;name: "${data.asn.name}",</div>
                <div>&nbsp;&nbsp;domain: "${data.asn.domain}",</div>
                <div>&nbsp;&nbsp;route: "${data.asn.route}",</div>
                <div>&nbsp;&nbsp;type: "${data.asn.type}"</div>
                <div>}</div>
                <div>company: {</div>
                <div>&nbsp;&nbsp;name: "${data.company.name}",</div>
                <div>&nbsp;&nbsp;domain: "${data.company.domain}",</div>
                <div>&nbsp;&nbsp;type: "${data.company.type}"</div>
                <div>}</div>
                <div>privacy: {</div>
                <div>&nbsp;&nbsp;vpn: ${data.privacy.vpn},</div>
                <div>&nbsp;&nbsp;proxy: ${data.privacy.proxy},</div>
                <div>&nbsp;&nbsp;tor: ${data.privacy.tor},</div>
                <div>&nbsp;&nbsp;relay: ${data.privacy.relay},</div>
                <div>&nbsp;&nbsp;hosting: ${data.privacy.hosting}</div>
                <div>}</div>
                <div>abuse: {</div>
                <div>&nbsp;&nbsp;address: "${data.abuse.address}",</div>
                <div>&nbsp;&nbsp;country: "${data.abuse.country}",</div>
                <div>&nbsp;&nbsp;email: "${data.abuse.email}",</div>
                <div>&nbsp;&nbsp;name: "${data.abuse.name}",</div>
                <div>&nbsp;&nbsp;phone: "${data.abuse.phone}"</div>
                <div>}</div>
            `;
            document.getElementById('result').innerHTML = resultHtml;
        })
        .catch(error => {
            document.getElementById('result').innerText = '查询失败: ' + error.message;
        });
};
