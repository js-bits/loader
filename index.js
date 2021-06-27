import fetch, { AbortController } from '@js-bits/fetch';
import enumerate from '@js-bits/enumerate';
import Timeout from '@js-bits/timeout';
import Executor from '@js-bits/executor';

const ERRORS = enumerate(String)`
  LoaderRequestAbortError
  LoaderTimeoutError
  LoaderRequestError
  LoaderResponseParsingError
`;

/**
 * Base AJAX loader class which provides all Executor's features
 * plus advanced errors handling and some utility functions.
 * @extends Executor
 */
class Loader extends Executor {
  constructor(options) {
    const baseOptions = {
      timings: options.timings,
    };

    if (options.timeout instanceof Timeout) {
      // hard timeout (numeric value) should not be passed here as it will be handles by jQuery.ajax module
      baseOptions.timeout = options.timeout;
      options.timeout = undefined;
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    const executor = async (resolve, reject) => {
      try {
        const response = await fetch(options.url, {
          ...options,
          signal,
        });

        if (response.ok) {
          let data;
          try {
            data = await response.json(); // dataType: 'json',
          } catch (error) {
            error.type = 'parsing-error';
            return reject(error, response);
          }
          return resolve(data);
        }
        reject(new Error(`${response.statusText}`), response);
      } catch (error) {
        reject(error);
      }
    };

    super(executor, baseOptions);

    this.abort = abortController.abort.bind(abortController);
    this.requestURL = options.url;
  }

  /**
   * @param {Error} error
   * @param {Response} response
   * @returns {void}
   */
  reject(error, response) {
    let reason = error;


    if (error.name === 'AbortError') {
      reason = new Error(`Request aborted: ${error.message}`);
      reason.name = ERRORS.LoaderRequestAbortError;
    } else {
      switch (error.type) {
        case 'request-timeout': // node-fetch only
          reason = new Error('Request timeout exceeded');
          reason.name = ERRORS.LoaderTimeoutError;
          break;
        case 'parsing-error':
          reason = new Error(`Response parsing error: ${error.message}`);
          reason.name = ERRORS.LoaderResponseParsingError;
          break;
        default:
          reason = new Error(`Request error: ${error.message}`);
          reason.name = ERRORS.LoaderRequestError;
      }
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
