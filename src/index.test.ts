import { cacheCandidate } from '@jointly/cache-candidate';
import { cacheCandidateDependencyManager } from './manager';
import { MockClass } from './test/MockClass3';
import { MockClass as MockClass2 } from './test/MockClass4';

import {
  step,
  sleep,
  ENOUGH_TIME,
  EXECUTION_MARGIN,
  flushMaps,
  pluginsOptions
} from './test/options';

const stepper = step();
beforeEach(async () => {
  await sleep(ENOUGH_TIME);
  flushMaps();
});

describe('CacheCandidatePlugin - CacheCandidate', () => {
  it('should expose manager', async () => {
    const step = stepper();
    new MockClass2(step, step, step, step);
    expect(cacheCandidateDependencyManager).toBeDefined();
  });

  it('should fill manager map if dependencyKeys is defined as array', async () => {
    const step = stepper();
    const mock = new MockClass(step, step, step, step);
    mock.mockFunction(step);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(2);
    mock.mockAsyncFunction(step);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(2);
  });

  it('should fill manager map if dependencyKeys is defined as function', async () => {
    const step = stepper();
    const mock = new MockClass2(step, step, step, step);
    await mock.mockAsyncFunction(step);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(3);
  });

  it('should delete a record if invalidated', async () => {
    const step = stepper();
    const mock = new MockClass(step, step, step, step);
    mock.mockFunction(step);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(2);
    cacheCandidateDependencyManager.invalidate('a');
    expect(cacheCandidateDependencyManager.instances.size).toBe(2);
  });

  it('should behave in the same way as a decorator if the higher-order function is used', async () => {
    let counter = 0;
    const mockFn = (step: number) =>
      new Promise((resolve) => {
        counter += step;
        resolve(counter);
      });
    const wrappedMockFn = cacheCandidate(mockFn, {
      requestsThreshold: 1,
      ttl: 800,
      ...pluginsOptions()
    });
    let result: unknown;
    result = await wrappedMockFn(1);
    await sleep(EXECUTION_MARGIN);
    expect(result).toBe(1);
    result = await wrappedMockFn(1);
    await sleep(EXECUTION_MARGIN);
    expect(result).toBe(1);
    result = await wrappedMockFn(1);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(1);
    await sleep(EXECUTION_MARGIN);
    expect(result).toBe(1);
    cacheCandidateDependencyManager.invalidate(0);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(1);
    cacheCandidateDependencyManager.invalidate(1);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(1);
    await sleep(EXECUTION_MARGIN);
  });
});
