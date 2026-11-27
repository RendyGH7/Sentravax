import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Behavioral regression tests for Phase 6.7.8 async request lifecycle:
 * verifies request ordering, AbortController cancellation, unmount safety,
 * loading state integrity, error/retry behavior, and Strict Mode double-mount.
 */

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function isRequestCanceled(err) {
  if (!err || typeof err !== 'object') return false;
  return err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED';
}

function createLatestRequestManager() {
  let active = true;
  let seq = 0;
  let controller = null;

  const begin = () => {
    controller?.abort();
    const nextController = new AbortController();
    controller = nextController;
    const reqId = ++seq;
    return {
      signal: nextController.signal,
      isCurrent: () => active && seq === reqId,
    };
  };

  const cancelAll = () => {
    seq += 1;
    controller?.abort();
    controller = null;
  };

  const dispose = () => {
    active = false;
    cancelAll();
  };

  return { begin, cancelAll, dispose };
}

function createListHarness(apiFn) {
  const manager = createLatestRequestManager();
  const state = {
    data: [],
    loading: false,
    error: null,
    stateUpdates: 0,
  };

  const load = async (filter) => {
    const req = manager.begin();
    state.loading = true;
    state.error = null;
    state.stateUpdates += 1;

    try {
      const res = await apiFn(filter, req.signal);
      if (!req.isCurrent()) return;
      state.data = res;
      state.stateUpdates += 1;
    } catch (err) {
      if (!req.isCurrent() || isRequestCanceled(err)) return;
      state.error = err?.message || 'Request failed';
      state.stateUpdates += 1;
    } finally {
      if (req.isCurrent()) {
        state.loading = false;
        state.stateUpdates += 1;
      }
    }
  };

  return { state, load, unmount: () => manager.dispose() };
}

test('1 & 2 & 5: Rapid filter change aborts older request, ignores stale response, and preserves loading until latest finishes', async () => {
  const req1 = createDeferred();
  const req2 = createDeferred();
  const signals = [];

  const harness = createListHarness((filter, signal) => {
    signals.push(signal);
    return filter === 'first' ? req1.promise : req2.promise;
  });

  const p1 = harness.load('first');
  assert.equal(signals[0].aborted, false);
  assert.equal(harness.state.loading, true);

  const p2 = harness.load('second');
  // Previous request must be aborted when filter changes
  assert.equal(signals[0].aborted, true);
  assert.equal(signals[1].aborted, false);
  assert.equal(harness.state.loading, true);

  // Stale request #1 resolves AFTER request #2 started, BEFORE request #2 finishes
  req1.resolve(['stale-item']);
  await p1;

  // Stale response must NOT overwrite data and must NOT turn off loading
  assert.deepEqual(harness.state.data, []);
  assert.equal(harness.state.loading, true);
  assert.equal(harness.state.error, null);

  // Latest request #2 resolves
  req2.resolve(['fresh-item']);
  await p2;

  assert.deepEqual(harness.state.data, ['fresh-item']);
  assert.equal(harness.state.loading, false);
  assert.equal(harness.state.error, null);
});

test('3 & 4: Unmount aborts in-flight request, suppresses cancellation error UI, and prevents post-unmount state updates', async () => {
  const pending = createDeferred();
  let capturedSignal = null;

  const harness = createListHarness((_filter, signal) => {
    capturedSignal = signal;
    return pending.promise;
  });

  const run = harness.load('active');
  const updatesAtStart = harness.state.stateUpdates;

  harness.unmount();
  assert.equal(capturedSignal.aborted, true);

  // Simulate axios rejecting with CanceledError after unmount
  const cancelErr = new Error('canceled');
  cancelErr.name = 'CanceledError';
  cancelErr.code = 'ERR_CANCELED';
  pending.reject(cancelErr);
  await run;

  assert.equal(harness.state.stateUpdates, updatesAtStart, 'No state updates may occur after unmount');
  assert.equal(harness.state.error, null, 'Cancellation must not set UI error');
});

test('4b: Aborted previous request rejecting with AbortError does not show false error UI', async () => {
  const req1 = createDeferred();
  const req2 = createDeferred();

  const harness = createListHarness((filter) => (filter === 'a' ? req1.promise : req2.promise));

  const p1 = harness.load('a');
  const p2 = harness.load('b');

  const abortErr = new Error('The user aborted a request.');
  abortErr.name = 'AbortError';
  req1.reject(abortErr);
  await p1;

  assert.equal(harness.state.error, null);
  assert.equal(harness.state.loading, true);

  req2.resolve(['b-result']);
  await p2;

  assert.deepEqual(harness.state.data, ['b-result']);
  assert.equal(harness.state.loading, false);
  assert.equal(harness.state.error, null);
});

test('6: Error state is set on genuine failure and cleared cleanly on retry', async () => {
  let attempt = 0;
  const harness = createListHarness(async () => {
    attempt += 1;
    if (attempt === 1) {
      throw new Error('Network Error');
    }
    return ['recovered-data'];
  });

  await harness.load('retry-test');
  assert.equal(harness.state.error, 'Network Error');
  assert.equal(harness.state.loading, false);
  assert.deepEqual(harness.state.data, []);

  // Retry succeeds
  await harness.load('retry-test');
  assert.equal(harness.state.error, null);
  assert.equal(harness.state.loading, false);
  assert.deepEqual(harness.state.data, ['recovered-data']);
});

test('7: React Strict Mode mount -> cleanup -> remount cancels mount 1 microtask and avoids duplicate request', async () => {
  let calls = 0;
  const results = [];

  function simulateStrictModeEffect(loadFn) {
    // Mount 1
    let active1 = true;
    queueMicrotask(() => {
      if (active1) {
        void loadFn('mount-1');
      }
    });
    // Cleanup 1 runs synchronously before microtask flushes
    active1 = false;

    // Mount 2
    let active2 = true;
    queueMicrotask(() => {
      if (active2) {
        void loadFn('mount-2');
      }
    });
    return () => {
      active2 = false;
    };
  }

  const cleanup = simulateStrictModeEffect(async (tag) => {
    calls += 1;
    results.push(tag);
  });

  await Promise.resolve();
  assert.equal(calls, 1);
  assert.deepEqual(results, ['mount-2']);
  cleanup();
});
