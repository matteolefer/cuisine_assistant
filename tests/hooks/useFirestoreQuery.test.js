import test from 'node:test';
import assert from 'node:assert/strict';
import { createHookEnvironment } from '../helpers/hookEnvironment.js';
import { createUseFirestoreQuery } from '../../src/hooks/useFirestoreQuery.js';
import firestoreService from '../../src/services/firestoreService.js';

test('useFirestoreQuery returns empty data when prerequisites are missing', () => {
  const originalListen = firestoreService.listenToCollection;
  let listenCalls = 0;
  firestoreService.listenToCollection = () => {
    listenCalls += 1;
    throw new Error('listenToCollection should not be invoked when prerequisites are missing');
  };

  try {
    const environment = createHookEnvironment();
    const useFirestoreQuery = createUseFirestoreQuery({
      useStateHook: environment.reactExports.useState,
      useEffectHook: environment.reactExports.useEffect,
    });

    const hook = environment.renderHook(() => useFirestoreQuery(null, 'app', 'user', 'items'));

    assert.deepEqual(hook.result.current.data, []);
    assert.equal(hook.result.current.loading, false);
    assert.equal(listenCalls, 0);

    hook.cleanup();
  } finally {
    firestoreService.listenToCollection = originalListen;
  }
});

test('useFirestoreQuery subscribes and updates data', () => {
  const originalListen = firestoreService.listenToCollection;
  let unsubscribeCalled = false;
  let receivedCallback = null;

  firestoreService.listenToCollection = (db, path, callback) => {
    receivedCallback = callback;
    assert.equal(path, 'artifacts/app/users/user/items');
    return () => {
      unsubscribeCalled = true;
    };
  };

  try {
    const environment = createHookEnvironment();
    const useFirestoreQuery = createUseFirestoreQuery({
      useStateHook: environment.reactExports.useState,
      useEffectHook: environment.reactExports.useEffect,
    });

    const hook = environment.renderHook(() => useFirestoreQuery({}, 'app', 'user', 'items'));

    assert.ok(receivedCallback, 'Listener should be attached');
    assert.equal(hook.result.current.loading, true, 'Loading remains true until callback resolves');

    receivedCallback([
      { id: '1', name: 'Tomate' },
      { id: '2', name: 'Basilic' },
    ]);

    assert.deepEqual(hook.result.current.data, [
      { id: '1', name: 'Tomate' },
      { id: '2', name: 'Basilic' },
    ]);
    assert.equal(hook.result.current.loading, false);

    hook.cleanup();
    assert.equal(unsubscribeCalled, true);
  } finally {
    firestoreService.listenToCollection = originalListen;
  }
});
