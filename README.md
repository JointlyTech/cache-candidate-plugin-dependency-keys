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





You can pass an additional `dependencyKeys` property to the decorator options which provides an invalidation mechanism to be called manually in your codebase.  
This property can be either an array of string, a function that returns an array of string or a function that returns a Promise fulfilled with an array of string.  
Both the function and the Promise will receive the result of the method on which the CacheCandidate operates.  
In case of an async method, the promise will be fulfilled before passing the result to the `dependencyKeys` function.  
The `dependencyKeys` function will be called only if the cache adapter correctly sets the value in the cache (i.e. the `.set` method is fulfilled).



## Cache invalidation

The cache invalidation is done using the exported `cacheCandidateDependencyManager` object.  
The object exposes the `invalidate` method which accepts a string.  
The string is one of the dependency keys returned by the `dependencyKeys` function/array defined in the decorator options. 

### Example

```typescript
import { cacheCandidate, cacheCandidateDependencyManager } from 'cache-candidate';

class MyClass {
  @CacheCandidate({
    dependencyKeys: (users) => {
      return users.map((user) => `users-${user.id}`);
      },
  })
  public async getUsers() {
    // Do something
    return users;
  }

  public async updateUser(user) {
    // Do something
    cacheCandidateDependencyManager.invalidate(`users-${user.id}`);
  }
}

const myClass = new MyClass();
const users = await myClass.getUsers();
users[0].name = 'New name';
await myClass.updateUser(users[0]); // This will invalidate the cache
```

