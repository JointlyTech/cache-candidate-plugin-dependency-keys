import test from 'node:test';
import assert from 'node:assert/strict';
import { cacheCandidate } from '@jointly/cache-candidate';
import { cacheCandidateDependencyManager } from './manager';
import {
  mockFunction,
  mockAsyncFunction,
  mockAsyncFunctionWithMultipleVariables
} from './test/utils';

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

test('CacheCandidatePlugin - CacheCandidate', async (t) => {
  t.beforeEach(async () => {
    await sleep(ENOUGH_TIME);
    flushMaps();
  });

  await t.test('should expose manager', async () => {
    const step = stepper();
    mockFunction(0);
    assert.ok(cacheCandidateDependencyManager);
  });

  await t.test(
    'should fill manager map if dependencyKeys is defined as array',
    async () => {
      const step = stepper();
      mockFunction(step);
      await sleep(EXECUTION_MARGIN);
      assert.equal(cacheCandidateDependencyManager.instances.size, 2);
      mockAsyncFunction(step);
      await sleep(EXECUTION_MARGIN);
      assert.equal(cacheCandidateDependencyManager.instances.size, 2);
    }
  );

  await t.test(
    'should fill manager map if dependencyKeys is defined as function',
    async () => {
      const step = stepper();
      await mockAsyncFunctionWithMultipleVariables(step);
      await sleep(EXECUTION_MARGIN);
      assert.equal(cacheCandidateDependencyManager.instances.size, 3);
    }
  );

  await t.test('should delete a record if invalidated', async () => {
    const step = stepper();
    mockFunction(step);
    await sleep(EXECUTION_MARGIN);
    assert.equal(cacheCandidateDependencyManager.instances.size, 2);
    await cacheCandidateDependencyManager.invalidate('a');
    assert.equal(cacheCandidateDependencyManager.instances.size, 0);
  });

  await t.test(
    'should delete a record if deleteKey is called directly',
    async () => {
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
      assert.equal(cacheCandidateDependencyManager.instances.size, 2);
      cacheCandidateDependencyManager.deleteKey(
        cacheCandidateDependencyManager.instances.get('1')![0].key
      );
      await sleep(EXECUTION_MARGIN);
      assert.equal(cacheCandidateDependencyManager.instances.size, 1);
      cacheCandidateDependencyManager.deleteKey(
        cacheCandidateDependencyManager.instances.get('3')![0].key
      );
      await sleep(EXECUTION_MARGIN);
      assert.equal(cacheCandidateDependencyManager.instances.size, 0);
    }
  );

  await t.test(
    'should delete the key from the manager when data cache record expires',
    async () => {
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
      assert.equal(cacheCandidateDependencyManager.instances.size, 1);
      await sleep(EXECUTION_MARGIN + TTL);
      assert.equal(cacheCandidateDependencyManager.instances.size, 0);
    }
  );

  await t.test(
    'should behave in the same way as a decorator if the higher-order function is used',
    async () => {
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
      assert.equal(counter, 1);
      await wrappedMockFn(1);
      await sleep(EXECUTION_MARGIN);
      assert.equal(counter, 1);
      await wrappedMockFn(1);
      await sleep(EXECUTION_MARGIN);
      assert.equal(cacheCandidateDependencyManager.instances.size, 1);
      await sleep(EXECUTION_MARGIN);
      assert.equal(counter, 1);
      cacheCandidateDependencyManager.invalidate(0);
      await sleep(EXECUTION_MARGIN);
      assert.equal(cacheCandidateDependencyManager.instances.size, 1);
      cacheCandidateDependencyManager.invalidate(1);
      await sleep(EXECUTION_MARGIN);
      assert.equal(cacheCandidateDependencyManager.instances.size, 0);
      await sleep(EXECUTION_MARGIN);
    }
  );

  await t.test(
    'should correctly pass fnArgs to the dependencyKeys function',
    async () => {
      const step = stepper();
      let capturedFnArgs: any = null;
      let capturedResult: any = null;
      
      const mockFn = (arg1: string, arg2: number, arg3: boolean) =>
        new Promise((resolve) => {
          resolve({ arg1, arg2, arg3 });
        });
      
      const wrappedMockFn = cacheCandidate(mockFn, {
        requestsThreshold: 1,
        ttl: 800,
        ...pluginsOptions((result: any, fnArgs: any[]) => {
          capturedResult = result;
          capturedFnArgs = fnArgs;
          return ['test-key'];
        })
      });
      
      await wrappedMockFn('hello', 42, true);
      await sleep(EXECUTION_MARGIN);
      
      assert.deepEqual(capturedFnArgs, ['hello', 42, true]);
      assert.deepEqual(capturedResult, { arg1: 'hello', arg2: 42, arg3: true });
      assert.equal(cacheCandidateDependencyManager.instances.size, 1);
      assert.ok(cacheCandidateDependencyManager.instances.has('test-key'));
    }
  );
});
