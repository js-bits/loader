// @ts-ignore
import { fetch, AbortController } from '@js-bits/fetch';
import parseDOM from '@js-bits/dom-parser';
import enumerate from '@js-bits/enumerate';
import Timeout from '@js-bits/timeout';
import { Executor } from '@js-bits/executor';

const { Prefix } = enumerate;

const ERRORS = enumerate.ts(
  `
  RequestAbortError
  TimeoutError
  RequestError
  ResponseParsingError
`,
  Prefix('Loader|')
);

/**
 * @typedef {import('@js-bits/executor/dist/src/executor').Options & {
 *  mimeType?: DOMParserSupportedType | 'text/plain' | 'application/json' | 'raw'
 * }} Options
 */

/**
 * @template T
 * @extends Executor<T>
 */
class Loader extends Executor {
  /**
   * @type {'Loader|RequestAbortError'}
   * @readonly
   */
  static RequestAbortError = ERRORS.RequestAbortError;

  /**
   * @type {'Loader|RequestError'}
   * @readonly
   */
  static RequestError = ERRORS.RequestError;

  /**
   * @type {'Loader|ResponseParsingError'}
   * @readonly
   */
  static ResponseParsingError = ERRORS.ResponseParsingError;

  /**
   * @type {'Loader|TimeoutError'}
   * @readonly
   */
  static TimeoutError = ERRORS.TimeoutError;

  /** @type {Response} */
  rawResponse;

  /**
   *
   * @param {string | URL} url
   * @param {Options} options - input parameters
   */
  constructor(url, options = {}) {
    const { timings, timeout, mimeType, ...fetchOptions } = options;
    const abortController = new AbortController();

    /**
     * @type {ConstructorParameters<typeof Executor<T>>[0]} executor
     */
    const executor = async (resolve, reject) => {
      try {
        const response = await fetch(url, {
          signal: abortController.signal,
          ...fetchOptions,
        });

        this.rawResponse = response;

        if (response.ok) {
          const responseType = response.headers.get('content-type');
          const resultType = mimeType || (typeof responseType === 'string' && responseType.replace(/;.+$/, '').trim());
          let data;
          try {
            switch (resultType) {
              case 'application/json':
                data = await response.json();
                break;
              case 'text/plain':
                data = await response.text();
                break;
              case 'text/xml':
              case 'text/html':
              case 'application/xml':
              case 'image/svg+xml':
                data = parseDOM(await response.text(), resultType);
                break;
              default:
                data = response;
            }
          } catch (cause) {
            const error = new Error(cause.message);
            error.name = 'ParsingError';
            error.cause = cause;
            reject(error);
          }
          resolve(data);
        }
        reject(new Error(`${response.statusText}`));
      } catch (error) {
        reject(error);
      }
    };

    super(executor, {
      timings,
      timeout,
    });

    this.abort = abortController.abort.bind(abortController);
    this.requestURL = url;
  }

  /**
   * @param {Error} error
   * @returns {this}
   */
  reject(error) {
    let reason;

    switch (error.name) {
      case 'AbortError':
        reason = new Error(`Request aborted: ${error.message}`);
        reason.name = ERRORS.RequestAbortError;
        break;
      case Timeout.TimeoutExceededError:
        this.abort();
        reason = new Error('Request timeout exceeded');
        reason.name = ERRORS.TimeoutError;
        break;
      case 'ParsingError':
        reason = new Error(`Response parsing error: ${error.message}`);
        reason.name = ERRORS.ResponseParsingError;
        break;
      default:
        reason = new Error(`Request error: ${error.message}`);
        reason.name = ERRORS.RequestError;
    }

    reason.cause = error.cause || error;
    // @ts-expect-error Property 'response' does not exist on type 'Error'.
    reason.response = this.rawResponse;
    // @ts-expect-error Property 'requestURL' does not exist on type 'Error'.
    reason.requestURL = this.requestURL;

    return super.reject(reason);
  }
}

/**
 * Just an alias of {@link Executor#execute} method
 */
Loader.prototype.send = Executor.prototype.execute;

/**
 * Just an alias of {@link Executor#execute} method
 */
Loader.prototype.load = Executor.prototype.execute;

Object.assign(Loader, ERRORS);

export default Loader;
