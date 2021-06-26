// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { cyan } from '@js-bits/log-in-color';
import Loader from './index.js';

const env = cyan(`[${typeof window === 'undefined' ? 'node' : 'jsdom'}]`);

describe(`Loader: ${env}`, () => {
  test('works', async () => {
    const swCharacter = new Loader({
      url: 'https://swapi.dev/api/people/1/',
    });

    swCharacter.load();
    expect(await swCharacter).toHaveProperty('name', 'Luke Skywalker');
    return swCharacter;
  });
});
