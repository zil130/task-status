import { BX24 } from 'bx24';
import getQueryString from './utils';

// eslint-disable-next-line no-restricted-globals
const bx24 = new BX24(window, parent);
window.bx24 = bx24;

export default new class BX24API {
  constructor() {
    this.auth();
    const urlParams = new URLSearchParams(window.location.search);
    this.baseUrl = `https://${urlParams.get('DOMAIN')}`;
  }

  async auth() {
    if (this.session?.ACCESS_TOKEN) {
      return this.session;
    }
    this.session = await bx24.getAuth();
    return this.session;
  }

  async callMethod(name, params = {}) {
    await this.auth();

    const paramsWithAuth = { ...params, auth: this.session.ACCESS_TOKEN };
    const queryString = getQueryString(paramsWithAuth);
    const result = await fetch(`${this.baseUrl}/rest/${name}?`, {
      method: 'POST',
      body: queryString,
    });

    return result.json();
  }

  async getAll(name, params = {}) {
    const response = await this.callMethod(name, params);
    const fullResponse = [response.result];

    const fetchNextPage = async (start) => {
      const newParams = { ...params, start };
      const tmpResponse = await this.callMethod(name, newParams);
      fullResponse.push(tmpResponse.result);

      if ('next' in tmpResponse) {
        await fetchNextPage(start + 50);
      }
    };

    if ('next' in response) {
      await fetchNextPage(50);
    }

    return fullResponse.reduce((result, obj) => {
      if (Array.isArray(obj[Object.keys(obj)[0]])) {
        result.push(...obj[Object.keys(obj)[0]]);
      }

      return result;
    }, []);
  }
}();
