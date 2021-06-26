/* eslint-disable no-underscore-dangle */
import $ from 'zepto';
import Timeout from '@js-bits/timeout';
import Executor from '@js-bits/executor';

const ERRORS = {
  ABORT: 'BaseLoaderRequestAbortError',
  TIMEOUT: 'BaseLoaderTimeoutError',
  REQUEST: 'BaseLoaderRequestError',
  PARSE: 'BaseLoaderResponseParsingError',
};

/**
 * Base AJAX loader class which provides all Executor's features
 * plus advanced errors handeling and some utility functions.
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

    super(baseOptions);

    this._ajaxSettings = options;
  }

  /**
   * @implements {Executor#_execute}
   * @protected
   * @returns {void}
   */
  _execute() {
    $.ajax(
      $.extend(
        {
          success: this._onSuccess.bind(this),
          error: this._onError.bind(this),

          // explicitly specified to prevent unexpected js execution with jQuery's "intelligent guess" by default
          dataType: 'json',
        },
        this._ajaxSettings
      )
    );
  }

  /**
   * Resolves loader promise with loaded data
   * @protected
   * @returns {void}
   */
  _onSuccess(...args) {
    this.resolve(...args);
  }

  /**
   * Converts jQuery.ajax error parameters to more meaningful form
   * @protected
   * @param {jqXHR} xhr - a superset of the XMLHTTPRequest object used by jQuery
   * @param {string} status - a string describing the type of error that occurred
   * @param {string} [errorThrown] - an exception object, if one occurred
   * @returns {void}
   */
  _onError(xhr, status, errorThrown) {
    if (errorThrown !== null && errorThrown !== undefined) {
      errorThrown = `. Cause: ${errorThrown}`;
    } else {
      errorThrown = '';
    }

    let error;

    switch (status) {
      case 'timeout':
        error = new Error('Request timeout exceeded');
        error.name = ERRORS.TIMEOUT;
        break;
      case 'parsererror':
        error = new Error(`Parsing error${errorThrown}`);
        error.name = ERRORS.PARSE;
        break;
      case 'abort':
        error = new Error(`Request aborted${errorThrown}`);
        error.name = ERRORS.ABORT;
        break;
      default:
        error = new Error(`Request error${errorThrown}`);
        error.name = ERRORS.REQUEST;
        error.httpStatusCode = xhr.status;
    }

    error.xhr = xhr;
    error.url = this._ajaxSettings.url;

    this.reject(error);
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

Loader.ERRORS = ERRORS;

export default Loader;
