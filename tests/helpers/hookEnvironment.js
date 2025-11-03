const noOp = () => {};

function depsChanged(prevDeps, nextDeps) {
  if (!prevDeps || !nextDeps) return true;
  if (prevDeps.length !== nextDeps.length) return true;
  for (let index = 0; index < prevDeps.length; index += 1) {
    if (!Object.is(prevDeps[index], nextDeps[index])) {
      return true;
    }
  }
  return false;
}

export function createHookEnvironment() {
  const states = [];
  const effects = [];
  let stateCursor = 0;
  let effectCursor = 0;
  let isRendering = false;
  let shouldRerender = false;
  let currentCallback = null;
  let result;

  const reactExports = {
    useState(initialState) {
      const cursor = stateCursor;
      if (states.length === cursor) {
        states.push(
          typeof initialState === 'function' ? initialState() : initialState,
        );
      }
      const setState = (value) => {
        const nextValue =
          typeof value === 'function' ? value(states[cursor]) : value;
        if (Object.is(states[cursor], nextValue)) return;
        states[cursor] = nextValue;
        scheduleRender();
      };
      const value = states[cursor];
      stateCursor += 1;
      return [value, setState];
    },
    useEffect(effect, deps) {
      const cursor = effectCursor;
      const previous = effects[cursor];
      const needsRun = !previous || depsChanged(previous.deps, deps);
      effects[cursor] = {
        deps,
        cleanup: previous?.cleanup ?? noOp,
        effect,
        pending: needsRun,
      };
      effectCursor += 1;
    },
  };

  function runEffects() {
    effects.forEach((entry, index) => {
      if (!entry.pending) return;
      if (typeof entry.cleanup === 'function') {
        entry.cleanup();
      }
      const cleanup = entry.effect();
      effects[index] = {
        ...entry,
        cleanup: typeof cleanup === 'function' ? cleanup : noOp,
        pending: false,
      };
    });
  }

  function flushRender() {
    if (!currentCallback) return;
    isRendering = true;
    stateCursor = 0;
    effectCursor = 0;
    result = currentCallback();
    isRendering = false;
    runEffects();
  }

  function scheduleRender() {
    if (isRendering) {
      shouldRerender = true;
      return;
    }
    do {
      shouldRerender = false;
      flushRender();
    } while (shouldRerender);
  }

  function renderHook(callback) {
    currentCallback = callback;
    scheduleRender();
    return {
      get result() {
        return { current: result };
      },
      rerender(newCallback = currentCallback) {
        currentCallback = newCallback;
        scheduleRender();
      },
      cleanup() {
        effects.forEach((entry) => {
          if (typeof entry.cleanup === 'function') {
            entry.cleanup();
          }
        });
        effects.length = 0;
      },
    };
  }

  return { reactExports, renderHook };
}
