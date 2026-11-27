import { useCallback, useEffect, useRef } from 'react';
import {
  createLatestRequestManager,
  isRequestCanceled,
  type LatestRequestToken,
} from '../lib/async-request';

export { isRequestCanceled, type LatestRequestToken };

export function useLatestRequest() {
  const managerRef = useRef<ReturnType<typeof createLatestRequestManager> | null>(null);

  useEffect(() => {
    const manager = createLatestRequestManager();
    managerRef.current = manager;
    return () => {
      manager.dispose();
    };
  }, []);

  const beginRequest = useCallback((): LatestRequestToken => {
    if (!managerRef.current) {
      managerRef.current = createLatestRequestManager();
    }
    return managerRef.current.begin();
  }, []);

  const cancelPending = useCallback((): void => {
    managerRef.current?.cancelAll();
  }, []);

  return { beginRequest, cancelPending };
}
