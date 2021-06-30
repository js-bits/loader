import fetch, { AbortController } from '@js-bits/fetch';
import parseDOM from '@js-bits/dom-parser';
import enumerate from '@js-bits/enumerate';
import Timeout from '@js-bits/timeout';
import Executor from '@js-bits/executor';

const ERRORS = enumerate(String)`
  LoaderRequestAbortError
  LoaderTimeoutError
  LoaderRequestError
  LoaderResponseParsingError
`;

class Loader extends Executor {
  constructor(url, options = {}) {
    const { timings, timeout, mimeType, ...fetchOptions } = options;
    const abortController = new AbortController();

    const executor = async (resolve, reject) => {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: abortController.signal,
        });

        if (response.ok) {
          const responseType = response.headers.get('content-type');
          const resultType = mimeType || responseType;
          let data;
          try {
            if (resultType.includes('application/json')) {
              data = await response.json();
            } else if (resultType.includes('text/plain')) {
              data = await response.text();
            } else if (
              resultType.includes('text/xml') ||
              resultType.includes('text/html') ||
              resultType.includes('application/xml') ||
              resultType.includes('image/svg+xml')
            ) {
              data = parseDOM(await response.text(), resultType);
            } else {
              data = response;
            }
          } catch (error) {
            error.name = 'ParsingError';
            return reject(error, response);
          }
          return resolve(data);
        }
        reject(new Error(`${response.statusText}`), response);
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
   * @param {Response} response
   * @returns {void}
   */
  reject(error, response) {
    let reason = error;

    switch (error.name) {
      case 'AbortError':
        reason = new Error(`Request aborted: ${error.message}`);
        reason.name = ERRORS.LoaderRequestAbortError;
        break;
      case Timeout.TimeoutExceededError:
        this.abort();
        reason = new Error('Request timeout exceeded');
        reason.name = ERRORS.LoaderTimeoutError;
        break;
      case 'ParsingError':
        reason = new Error(`Response parsing error: ${error.message}`);
        reason.name = ERRORS.LoaderResponseParsingError;
        break;
      default:
        reason = new Error(`Request error: ${error.message}`);
        reason.name = ERRORS.LoaderRequestError;
    }

    reason.response = response;
    reason.requestURL = this.requestURL;

    super.reject(reason);
  }
}

/**
 * Just an alias of {@link Executor#execute} method
 */
Loader.prototype.send = Loader.prototype.execute;

/**
 * Just an alias of {@link Executor#execute} method
 */
Loader.prototype.load = Loader.prototype.execute;

Object.assign(Loader, ERRORS);

export default Loader;
