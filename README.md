# What is this?

This is a plugin for [@jointly/cache-candidate](https://github.com/JointlyTech/cache-candidate) that allows you to use a dependency keys mechanism to invalidate the cache records.


## How To Install?

```bash
$ npm install @jointly/cache-candidate-plugin-dependency-keys
```

## How To Use It?

The library exposes a `PluginDependencyKeys` object that can be used as a plugin for the `cacheCandidate` library and a `cacheCandidateDependencyManager` object that can be used to invalidate the cache records.


```typescript
import { cacheCandidate } from '@jointly/cache-candidate';
import { PluginDependencyKeys, cacheCandidateDependencyManager } from '@jointly/cache-candidate-plugin-dependency-keys';

async function getUsers() {
  // Do something
  return users;
}

async function updateUser(user) {
  // Do something
  cacheCandidateDependencyManager.invalidate(`users-${user.id}`);
  return user;
}

const cachedGetUsers = cacheCandidate(getUsers, {
  requestsThreshold: 1,
  plugins: [
      {
        name: PluginDependencyKeys.name,
        hooks: PluginDependencyKeys.hooks,
        // ...PluginDependencyKeys would to the same
        additionalParameters: { dependencyKeys: (users) => users.map((user) => `users-${user.id}`) }
      }
    ]
});

let users;
users = await cachedGetUsers(); // <-- This will be executed and cached
users = await cachedGetUsers(); // <-- This will be retrieved from the cache
await updateUser({ id: 1, name: 'John' });
users = await cachedGetUsers(); // <-- This will be executed and cached
```

You can pass an additional parameter `dependencyKeys` property which instructs the plugin about which keys to use to invalidate the cache records if necessary.  
This property can be either an array of strings, a function that returns an array of strings or a function that returns a Promise fulfilled with an array of strings.  
Both the function and the Promise will receive the result of the method on which the `cacheCandidate` operates.  
In case of an async method, the promise will be fulfilled before passing the result to the `dependencyKeys` function.  
The `dependencyKeys` function will be called only if the cache adapter correctly sets the value in the cache (i.e. the `.set` method is fulfilled).