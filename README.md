# HTTP resource Loader

An implementation of [Executor](https://www.npmjs.com/package/@js-bits/executor) aimed to be used to load resources over HTTP. Built with [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) under the hood. Key features: automatic response type conversion; built-in timeout and abort capability; execution timings.

## Installation

Install with npm:

```
npm install @js-bits/loader
```

Install with yarn:

```
yarn add @js-bits/loader
```

Import where you need it:

```javascript
import Loader from '@js-bits/loader';
```

## How to use

Simple example

```javascript
const swCharacter = new Loader('https://swapi.dev/api/people/1/');

(async () => {
  swCharacter.load(); // just a contextualized alias of Executor#execute();
  const result = await swCharacter;
  console.log(result.name); // Luke Skywalker
})();
```

Content type is automatically detected and the result type is based on that information. It can be one of the following:

- [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) - for `'application/json'` content
- [String](https://developer.mozilla.org/en-US/docs/Glossary/String) - for `'text/plain'` content
- [HTMLDocument](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDocument) - for `'text/html'` content
- [XMLDocument](https://developer.mozilla.org/en-US/docs/Web/API/XMLDocument) - for XML based content (like `'text/xml'`, and `'image/svg+xml'`)
- Raw [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object when content type is not recognized

You can also explicitly specify expected content type using optional `mimeType` parameter.

```javascript
const xml = new Loader('https://api.nbp.pl/api/exchangerates/tables/a/last/1/?format=xml', {
  mimeType: 'text/plain',
});

(async () => {
  xml.load();
  const result = await xml;
  console.log(result.slice(0, 38)); // <?xml version="1.0" encoding="utf-8"?>
})();
```

Since `Loader` is built with [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) you can pass [fetch parameters](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) the same way, using second argument.

```javascript
const xml = new Loader(url, {
  method: 'POST',
  headers: {...}
  body: '...',
});
```

## Additional features

There are `Loader#send()` and `Loader#load()` aliases of `Executor#execute()` method available for convenience. Also, unlike `fetch()`, `Loader` has built-in `.abort()` method.

Features of [Executor](https://www.npmjs.com/package/@js-bits/executor), like [execution timings](https://www.npmjs.com/package/@js-bits/executor#execution-timings) and [hard/soft timeout](https://www.npmjs.com/package/@js-bits/executor#timeout) are also available here.

## Error handling

[TBD]

## Notes

- Requires [ECMAScript modules](https://nodejs.org/api/esm.html) to be enabled in Node.js environment. Otherwise, compile into a CommonJS module.
- Does not include any polyfills, which means that Internet Explorer is not supported.
