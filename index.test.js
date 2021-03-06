// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import Loader from './index.js';
// const Loader = require('./dist/index.cjs');

describe(`Loader`, () => {
  test('successful request', async () => {
    const swCharacter = new Loader('https://swapi.dev/api/people/1/');

    swCharacter.load();
    expect(await swCharacter).toHaveProperty('name', 'Luke Skywalker');
    return swCharacter;
  });

  describe('MIME types', () => {
    test('text/plain', async () => {
      expect.assertions(2);
      const swCharacter = new Loader('https://swapi.dev/api/people/1/', {
        mimeType: 'text/plain',
      });

      swCharacter.load();
      const result = await swCharacter;
      expect(typeof result).toEqual('string');
      expect(result).toContain('Luke Skywalker');
      return swCharacter;
    });

    test('text/xml', async () => {
      expect.assertions(1);
      const xml = new Loader('https://api.nbp.pl/api/exchangerates/tables/a/last/1/?format=xml', {
        mimeType: 'text/xml',
      });

      xml.load();
      const result = await xml;
      const rates = result.querySelectorAll('Rates > Rate');
      expect(rates.length).toBeGreaterThan(10);
      return xml;
    });

    test('raw response', async () => {
      expect.assertions(1);
      const swCharacter = new Loader('https://swapi.dev/api/people/1/', {
        mimeType: 'raw',
      });

      swCharacter.load();
      const result = await swCharacter;
      expect(result).toHaveProperty('statusText', 'OK');
      return swCharacter;
    });
  });

  test('request error', async () => {
    expect.assertions(6);
    const url = 'https://swapi.dev/api/people/10000/';
    const swCharacter = new Loader(url);

    swCharacter.load();

    try {
      await swCharacter;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.LoaderRequestError);
      expect(reason).toHaveProperty('message', 'Request error: NOT FOUND');
      expect(reason).toHaveProperty('requestURL', url);
      expect(reason.response).toHaveProperty('status', 404);
      expect(reason.response).toHaveProperty('url', url);
      expect(reason.cause).toBeInstanceOf(Error);
    }
  });

  test('timeout error', async () => {
    expect.assertions(5);
    const url = 'https://swapi.dev/api/people/1/';
    const swCharacter = new Loader(url, {
      timeout: 100,
    });

    swCharacter.load();

    try {
      await swCharacter;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.LoaderTimeoutError);
      expect(reason).toHaveProperty('message', 'Request timeout exceeded');
      expect(reason).toHaveProperty('requestURL', url);
      expect(reason.response).toBeUndefined();
      expect(reason.cause).toBeInstanceOf(Error);
    }
  });

  test('parsing error', async () => {
    expect.assertions(6);
    const url = 'https://www.bankofcanada.ca/valet/observations/group/FX_RATES_DAILY/xml?start_date=2021-05-30';
    const dailyRates = new Loader(url, { mimeType: 'application/json' });

    dailyRates.load();

    try {
      await dailyRates;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.LoaderResponseParsingError);
      expect(reason).toHaveProperty(
        'message',
        `Response parsing error: invalid json response body at ${url} reason: Unexpected token < in JSON at position 0`
      );
      expect(reason).toHaveProperty('requestURL', url);
      expect(reason.response).toHaveProperty('status', 200);
      expect(reason.response).toHaveProperty('url', url);
      expect(reason.cause).toBeInstanceOf(Error);
    }
  });

  test('abort error', async () => {
    expect.assertions(5);
    const url = 'https://swapi.dev/api/people';
    const dailyRates = new Loader(url);

    dailyRates.load();

    setTimeout(() => {
      dailyRates.abort();
    }, 100);

    try {
      await dailyRates;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.LoaderRequestAbortError);
      expect(reason).toHaveProperty('message', 'Request aborted: The user aborted a request.');
      expect(reason).toHaveProperty('requestURL', url);
      expect(reason.response).toBeUndefined();
      expect(reason.cause).toBeInstanceOf(Error);
    }
  });
});
