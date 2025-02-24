import { cacheCandidate } from '@jointly/cache-candidate';
import { options, pluginsOptions } from './options';

export const mockAsyncFunction = cacheCandidate(async (step: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([step, step + 1, step + 2]);
    }, 10);
  });
}, {
  ...options,
  ...pluginsOptions(function (result) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(result);
      }, 10);
    });
  })
})

export const mockFunction = cacheCandidate((step: number) => {
  return [step, step + 1, step + 2];
}, { ...options, ...pluginsOptions((result) => result) });
