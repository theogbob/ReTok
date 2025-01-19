const { SocksProxyAgent } = require('socks-proxy-agent');

class ProxyConfig {
    constructor(proxyUrl = 'socks5://127.0.0.1:55555') {
        this.proxyUrl = proxyUrl;
        this.agent = new SocksProxyAgent(proxyUrl);
    }

    getAgent() {
        return this.agent;
    }

    getProxyUrl() {
        return this.proxyUrl;
    }
}

const proxyConfig = new ProxyConfig();
module.exports = proxyConfig;
