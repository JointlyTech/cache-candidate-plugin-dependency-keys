# What is this?

This is a plugin for [@jointly/cache-candidate](https://github.com/JointlyTech/cache-candidate) that allows you to use a dependency keys mechanism to invalidate the cache.


## How To Install?

```bash
$ npm install @jointly/cache-candidate-plugin-dependency-keys
```

## How To Use It?

```ts
const { PluginDependencyKeys } = require('@jointly/cache-candidate-plugin-dependency-keys');
const { cacheCandidate } = require('@jointly/cache-candidate');

let counter = 0;
const mockFn = (step: number) =>
  new Promise((resolve) => {
    counter += step;
    resolve(counter);
  });
const wrappedMockFn = cacheCandidate(mockFn, {
  requestsThreshold: 1,
  ttl: 800,
  {
    plugins: [
      {
        ...PluginDependencyKeys,
        ...{
          additionalParameters: { dependencyKeys: ['result-of-my-fn'] }
        }
      }
    ]
  };
});
let result: unknown;
result = await wrappedMockFn(1);
await sleep(EXECUTION_MARGIN); // Simulating a delay to allow the event loop to run
expect(result).toBe(1);
result = await wrappedMockFn(1);
await sleep(EXECUTION_MARGIN);
expect(result).toBe(1);
cacheCandidateDependencyManager.invalidate('result-of-my-fn');
```