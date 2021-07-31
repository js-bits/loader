'use strict';

var fetch = require('@js-bits/fetch');
var parseDOM = require('@js-bits/dom-parser');
var enumerate = require('@js-bits/enumerate');
var Timeout = require('@js-bits/timeout');
var Executor = require('@js-bits/executor');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);
var parseDOM__default = /*#__PURE__*/_interopDefaultLegacy(parseDOM);
var enumerate__default = /*#__PURE__*/_interopDefaultLegacy(enumerate);
var Timeout__default = /*#__PURE__*/_interopDefaultLegacy(Timeout);
var Executor__default = /*#__PURE__*/_interopDefaultLegacy(Executor);

const ERRORS = enumerate__default['default'](String)`
  LoaderRequestAbortError
  LoaderTimeoutError
  LoaderRequestError
  LoaderResponseParsingError
`;

class Loader extends Executor__default['default'] {
  constructor(url, options = {}) {
    const { timings, timeout, mimeType, ...fetchOptions } = options;
    const abortController = new fetch.AbortController();

    const executor = async (resolve, reject) => {
      try {
        const response = await fetch__default['default'](url, {
          signal: abortController.signal,
          ...fetchOptions,
        });

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
                data = parseDOM__default['default'](await response.text(), resultType);
                break;
              default:
                data = response;
            }
          } catch (cause) {
            const error = new Error(cause.message);
            error.name = 'ParsingError';
            error.cause = cause;
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
    let reason;

    switch (error.name) {
      case 'AbortError':
        reason = new Error(`Request aborted: ${error.message}`);
        reason.name = ERRORS.LoaderRequestAbortError;
        break;
      case Timeout__default['default'].TimeoutExceededError:
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

    reason.cause = error.cause || error;
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

module.exports = Loader;
