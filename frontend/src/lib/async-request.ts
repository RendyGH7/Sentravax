export interface LatestRequestToken {
  signal: AbortSignal;
  isCurrent: () => boolean;
}

export function isRequestCanceled(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const candidate = err as { name?: string; code?: string };
  return (
    candidate.name === 'CanceledError' ||
    candidate.name === 'AbortError' ||
    candidate.code === 'ERR_CANCELED'
  );
}

/**
 * Coordinates sequential request identity and AbortController cancellation
 * so stale responses or post-unmount completions never mutate component state.
 */
export function createLatestRequestManager() {
  let active = true;
  let seq = 0;
  let controller: AbortController | null = null;

  const begin = (): LatestRequestToken => {
    controller?.abort();
    const nextController = new AbortController();
    controller = nextController;
    const reqId = ++seq;

    return {
      signal: nextController.signal,
      isCurrent: () => active && seq === reqId,
    };
  };

  const cancelAll = (): void => {
    seq += 1;
    controller?.abort();
    controller = null;
  };

  const dispose = (): void => {
    active = false;
    cancelAll();
  };

  return {
    begin,
    cancelAll,
    dispose,
  };
}
