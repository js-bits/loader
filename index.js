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
        const response = await fetch(this.ajaxSettings.url, this.ajaxSettings);

        // explicitly specified to prevent unexpected js execution with jQuery's "intelligent guess" by default
        // dataType: 'json',
        resolve(response.json());
      } catch (error) {
        console.log(error);
        reject(error);
      }
    };

    super(executor, baseOptions);

    this.ajaxSettings = options;
  }

  /**
   * Converts jQuery.ajax error parameters to more meaningful form
   * @param {jqXHR} xhr - a superset of the XMLHTTPRequest object used by jQuery
   * @param {string} status - a string describing the type of error that occurred
   * @param {string} [errorThrown] - an exception object, if one occurred
   * @returns {void}
   */
  reject(xhr, status, errorThrown) {
    if (errorThrown !== null && errorThrown !== undefined) {
      errorThrown = `. Cause: ${errorThrown}`;
    } else {
      errorThrown = '';
    }

    let error;

    switch (status) {
      case 'timeout':
        error = new Error('Request timeout exceeded');
        error.name = ERRORS.LoaderTimeoutError;
        break;
      case 'parsererror':
        error = new Error(`Parsing error${errorThrown}`);
        error.name = ERRORS.LoaderResponseParsingError;
        break;
      case 'abort':
        error = new Error(`Request aborted${errorThrown}`);
        error.name = ERRORS.LoaderRequestAbortError;
        break;
      default:
        error = new Error(`Request error${errorThrown}`);
        error.name = ERRORS.LoaderRequestError;
        error.httpStatusCode = xhr.status;
    }

    error.xhr = xhr;
    error.url = this.ajaxSettings.url;

    super.reject(error);
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
