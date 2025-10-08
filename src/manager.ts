import { PluginPayload } from '@jointly/cache-candidate-plugin-base';

const makeDependencyManager = () => {
  const instances: Map<string, Array<PluginPayload>> = new Map();
  return {
    register: (payload: PluginPayload, dependencyKeys: string[]) => {
      for (const dependencyKey of dependencyKeys) {
        if (!instances.has(dependencyKey)) {
          instances.set(dependencyKey, [payload]);
        } else {
          // Check if payload.key doesn't exist already, if so remove it from the list
          let found = false;
          for (const _payload of instances.get(dependencyKey) ?? []) {
            if (_payload.key === payload.key) {
              found = true;
            }
          }
          if (!found) {
            instances.get(dependencyKey)?.push(payload);
          }
        }
      }
    },
    invalidate: async (dependencyKey: string | number) => {
      if (typeof dependencyKey === 'number') {
        dependencyKey = dependencyKey.toString();
      }

      if (!instances.has(dependencyKey)) {
        return;
      }

      for (const payload of instances.get(dependencyKey) ?? []) {
        await payload.internals?.deleteDataCacheRecord({
          options: payload.options,
          key: payload.key,
          HookPayload: payload,
          result: null, // Currently, stale-while-revalidate is not supported.
          staleMap: new Map(), // Currently, stale-while-revalidate is not supported.
          forceDeleteFn: true
        });
      }

      return;
    },
    deleteKey: (dataCacheRecordKey: string) => {
      for (const [dependencyKey, payloadList] of instances.entries()) {
        if (payloadList.some((_key) => _key.key === dataCacheRecordKey)) {
          if (payloadList.length === 1) {
            instances.delete(dependencyKey);
          } else {
            instances.set(
              dependencyKey,
              payloadList.filter((_key) => _key.key !== dataCacheRecordKey)
            );
          }
        }
      }
    },
    instances
  };
};

export const cacheCandidateDependencyManager = makeDependencyManager();

/*
[abc][1,2,3]
[def][3,4,5]

[1] => [abc]
[2] => [abc]
[3] => [abc, def]
[4] => [def]
[5] => [def]
*/
