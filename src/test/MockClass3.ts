import { cacheCandidate } from '@jointly/cache-candidate';
import { options, pluginsOptions } from './options';

export const mockAsyncFunction = cacheCandidate(async (step: number) => {
  return step;
}, { ...options, ...pluginsOptions(['a', 'b']) });

export const mockFunction = cacheCandidate((step: number) => {
  return step;
}, { ...options, ...pluginsOptions(['a', 'b']) });