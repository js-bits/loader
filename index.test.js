// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { cyan } from '@js-bits/log-in-color';
import Loader from './index.js';

const env = cyan(`[${typeof window === 'undefined' ? 'node' : 'jsdom'}]`);

describe(`Loader: ${env}`, () => {
  test('successful request', async () => {
    const swCharacter = new Loader({
      url: 'https://swapi.dev/api/people/1/',
    });

    swCharacter.load();
    expect(await swCharacter).toHaveProperty('name', 'Luke Skywalker');
    return swCharacter;
  });

  test('request error', async () => {
    expect.assertions(2);
    const swCharacter = new Loader({
      url: 'https://swapi.dev/api/people/10000/',
    });

    swCharacter.load();

    try {
      await swCharacter;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.LoaderRequestError);
      expect(reason).toHaveProperty('message', 'Request error. Cause: NOT FOUND');
    }
  });

  test('timeout error', async () => {
    expect.assertions(2);
    const swCharacter = new Loader({
      url: 'https://swapi.dev/api/people/1/',
      timeout: 100,
    });

    swCharacter.load();

    try {
      await swCharacter;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.LoaderTimeoutError);
      expect(reason).toHaveProperty('message', 'Request timeout exceeded');
    }
  });

  test('parse error', async () => {
    expect.assertions(2);
    const dailyRates = new Loader({
      url: 'https://www.bankofcanada.ca/valet/observations/group/FX_RATES_DAILY/xml?start_date=2021-05-30',
    });

    dailyRates.load();

    try {
      await dailyRates;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.LoaderResponseParsingError);
      expect(reason).toHaveProperty(
        'message',
        'Parsing error. Cause: SyntaxError: Unexpected token < in JSON at position 0'
      );
    }
  });

  test('abort error', async () => {
    expect.assertions(2);
    const dailyRates = new Loader({
      url: 'https://swapi.dev/api/people',
      beforeSend: xhr => {
        setTimeout(() => {
          xhr.abort();
        }, 100);
      },
    });

    dailyRates.load();

    try {
      await dailyRates;
    } catch (reason) {
      expect(reason).toHaveProperty('name', Loader.LoaderRequestAbortError);
      expect(reason).toHaveProperty('message', 'Request aborted. Cause: abort');
    }
  });
});
