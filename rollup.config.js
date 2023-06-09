/* eslint-disable import/no-extraneous-dependencies */
import virtual from '@rollup/plugin-virtual';

export default {
  input: './index.js',
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
    exports: 'default',
    preferConst: true,
  },
  plugins: [
    virtual({
      '@js-bits/fetch': "export default (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))",
    }),
  ],
};
