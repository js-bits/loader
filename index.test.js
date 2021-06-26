// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { cyan } from '@js-bits/log-in-color';
import Loader from './index.js';

const env = cyan(`[${typeof window === 'undefined' ? 'node' : 'jsdom'}]`);

describe(`Loader: ${env}`, () => {
  test('works', async () => {
    const loader = new Loader({
      url: 'https://swapi.dev/api/people/1/',
    });

    loader.load();

    const result = await loader;
    expect(result).toHaveProperty('name', 'Luke Skywalker');
    return loader;
  });
});
