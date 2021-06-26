import fetch from '@js-bits/fetch';
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

    const executor = async (resolve, reject) => {
      try {
        const response = await fetch(options.url, options);

        if (response.ok) {
          // explicitly specified to prevent unexpected js execution with jQuery's "intelligent guess" by default
          // dataType: 'json',
          // console.log('response', response);
          try {
            const json = await response.json();
            resolve(json);
          } catch (error) {
            reject(error, response);
          }
        } else {
          reject(new Error(`${response.statusText}`), response);
        }
      } catch (error) {
        reject(error);
      }
    };

    super(executor, baseOptions);

    this.requestURL = options.url;
  }

  /**
   * @param {Error} error
   * @param {Response} response
   * @returns {void}
   */
  reject(error, response) {
    let reason = error;

    console.log('fetch API error', error);

    switch (error.type) {
      case 'request-timeout': // node-fetch only
        reason = new Error('Request timeout exceeded');
        reason.name = ERRORS.LoaderTimeoutError;
        break;
      case 'invalid-json': // node-fetch only
        reason = new Error(`Response parsing error: ${error.message}`);
        reason.name = ERRORS.LoaderResponseParsingError;
        break;
      case 'aborted': // node-fetch only
        reason = new Error(`Request aborted: ${error.message}`);
        reason.name = ERRORS.LoaderRequestAbortError;
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
