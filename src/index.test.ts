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
  pluginsOptions,
  TTL
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
    await cacheCandidateDependencyManager.invalidate('a');
    expect(cacheCandidateDependencyManager.instances.size).toBe(0);
  });

  it('should delete a record if deleteKey is called directly', async () => {
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
    await wrappedMockFn(1);
    await wrappedMockFn(2);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(2);
    cacheCandidateDependencyManager.deleteKey(
      cacheCandidateDependencyManager.instances.get('1')![0].key
    );
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(1);
    cacheCandidateDependencyManager.deleteKey(
      cacheCandidateDependencyManager.instances.get('3')![0].key
    );
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(0);
  });

  it('should delete the key from the manager when data cache record expires', async () => {
    let counter = 0;
    const mockFn = (step: number) =>
      new Promise((resolve) => {
        counter += step;
        resolve(counter);
      });
    const wrappedMockFn = cacheCandidate(mockFn, {
      requestsThreshold: 1,
      ttl: TTL,
      ...pluginsOptions()
    });

    await wrappedMockFn(1);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(1);
    await sleep(EXECUTION_MARGIN + TTL);
    expect(cacheCandidateDependencyManager.instances.size).toBe(0);
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
    await wrappedMockFn(1);
    await sleep(EXECUTION_MARGIN);
    expect(counter).toBe(1);
    await wrappedMockFn(1);
    await sleep(EXECUTION_MARGIN);
    expect(counter).toBe(1);
    await wrappedMockFn(1);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(1);
    await sleep(EXECUTION_MARGIN);
    expect(counter).toBe(1);
    cacheCandidateDependencyManager.invalidate(0);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(1);
    cacheCandidateDependencyManager.invalidate(1);
    await sleep(EXECUTION_MARGIN);
    expect(cacheCandidateDependencyManager.instances.size).toBe(0);
    await sleep(EXECUTION_MARGIN);
  });
});
