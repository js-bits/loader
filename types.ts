export type Options = import('@js-bits/executor/dist/src/executor').Options & {
  mimeType?: DOMParserSupportedType | 'text/plain' | 'application/json' | 'raw';
};
