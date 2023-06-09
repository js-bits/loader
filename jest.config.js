const config = {
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      setupFiles: ['./jest.setup.js'],
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
    },
  ],
};

export default config;
