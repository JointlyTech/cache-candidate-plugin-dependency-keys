import { cacheCandidateDependencyManager } from '../manager';
import { PluginDependencyKeys } from '../plugin';
import { eventHits } from '../test/options';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export const TTL = 100;
export const EXECUTION_MARGIN = 50; // A margin of error for the execution time. This is because the execution time is not 100% accurate and can vary based on the machine.
export const ENOUGH_TIME = 250;
export function pluginsOptions(
  dependencyKeys: any = (result: number) => result
) {
  return {
    plugins: [
      {
        ...PluginDependencyKeys,
        ...{
          additionalParameters: { dependencyKeys }
        }
      }
    ]
  };
}

export function flushMaps() {
  for (const [key] of eventHits) {
    eventHits.set(key, 0);
  }
  cacheCandidateDependencyManager.instances.clear();
}
