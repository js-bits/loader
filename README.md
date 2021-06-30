# HTTP resource loader

An implementation of [Executor](https://www.npmjs.com/package/@js-bits/executor) aimed to be used to load resources over HTTP. Built with [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) under the hood.

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

Content type will be automatically detected and the result type will be based on that information. It can be one of the following:

- `Object` - for `'application/json'` content
- `String` - for `'text/plain'` content
- [HTMLDocument](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDocument) - for `'text/html'` content
- [XMLDocument](https://developer.mozilla.org/en-US/docs/Web/API/XMLDocument) - for XML based content (like `'text/xml'`, and `'image/svg+xml'`)
- And raw [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) when content type is not recognized

Since `Loader` is an implementation of [Executor](https://www.npmjs.com/package/@js-bits/executor), features like [execution timings](https://www.npmjs.com/package/@js-bits/executor#execution-timings) and [hard/soft timeout](https://www.npmjs.com/package/@js-bits/executor#timeout) are also available here.

## Notes

- Requires [ECMAScript modules](https://nodejs.org/api/esm.html) to be enabled in Node.js environment. Otherwise, compile into a CommonJS module.
- Does not include any polyfills, which means that Internet Explorer is not supported.
