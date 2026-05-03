import { HttpsProxyAgent } from 'https-proxy-agent';

export class ProxyAgentFactory {
  constructor(proxyConfig) {
    const { host, port, username, password } = proxyConfig;
    const auth = `${encodeURIComponent(username)}:${encodeURIComponent(password)}`;
    this.proxyUrl = `http://${auth}@${host}:${port}`;
    this.agent = new HttpsProxyAgent(this.proxyUrl);
  }

  getAgent() {
    return this.agent;
  }

  getProxyUrl() {
    return this.proxyUrl;
  }
}
