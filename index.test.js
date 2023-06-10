/// <reference lib="dom" />

// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import Loader from './index.js';
// const Loader = require('./dist/index.cjs');

describe('Loader', () => {
  test('STATES', async () => {
    expect(Loader.STATES.EXECUTED).toEqual('EXECUTED');
    expect(Loader.STATES.RESOLVED).toEqual('RESOLVED');
  });

  test('successful request', async () => {
    const swCharacter = new Loader('https://swapi.dev/api/people/1/');

    swCharacter.load();
    expect(await swCharacter).toHaveProperty('name', 'Luke Skywalker');
    return swCharacter;
  });

  describe('MIME types', () => {
    test('text/plain', async () => {
      expect.assertions(4);
      /** @type {Loader<string>} */
      const swCharacter = new Loader('https://swapi.dev/api/people/1/', {
        mimeType: 'text/plain',
      });

      swCharacter.load();
      const result = await swCharacter;
      expect(typeof result).toEqual('string');
      expect(result).toContain('Luke Skywalker');
      expect(swCharacter.timings[Loader.STATES.RESOLVED]).toBeGreaterThan(0);
      expect(swCharacter.timings[Loader.STATES.RESOLVED]).toBeGreaterThan(swCharacter.timings[Loader.STATES.EXECUTED]);
      return swCharacter;
    });

    test('text/xml', async () => {
      expect.assertions(1);
      /** @type {Loader<XMLDocument>} */
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

    swCharacter.send();

    try {
      await swCharacter;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.RequestError);
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

    swCharacter.send();

    try {
      await swCharacter;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.TimeoutError);
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

    dailyRates.send();

    try {
      await dailyRates;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.ResponseParsingError);
      expect(reason.message).toMatch('Response parsing error:');
      expect(reason).toHaveProperty('requestURL', url);
      expect(reason.response).toHaveProperty('status', 200);
      expect(reason.response).toHaveProperty('url', url);
      expect(reason.cause.name).toMatch('Error');
    }
  });

  test('abort error', async () => {
    expect.assertions(5);
    const url = 'https://swapi.dev/api/people';
    const dailyRates = new Loader(url);

    dailyRates.send();

    setTimeout(() => {
      dailyRates.abort();
    }, 100);

    try {
      await dailyRates;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.RequestAbortError);
      expect(reason.message).toMatch('Request aborted:');
      expect(reason).toHaveProperty('requestURL', url);
      expect(reason.response).toBeUndefined();
      expect(reason.cause.name).toMatch('Error');
    }
  });
});
