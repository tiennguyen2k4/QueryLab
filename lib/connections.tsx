'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { NativePostgresAdapter } from './engine/native-client';
import type { DatasetSize } from './engine/types';
import { DirectDatabaseClient, DirectDatabaseRequestError, type ConnectionInput } from './local-db/client';
import { createWorkspaceSession, type DatabaseCatalog, type WorkspaceAdapter, type WorkspaceSession } from './workspace';

type Mode = 'browser' | 'native';
type ConnectionState = {
  mode: Mode;
  native: NativePostgresAdapter | null;
  nativeSize: DatasetSize;
  local: DirectDatabaseClient | null;
  catalog: DatabaseCatalog | null;
  workspaceSession: WorkspaceSession;
  updateWorkspaceSession(adapter: WorkspaceAdapter | null, update: SetStateAction<WorkspaceSession>): void;
  connecting: boolean;
  error: string;
  errorCode: string;
  connect(code: string, size: DatasetSize, rebuild?: boolean): Promise<boolean>;
  connectDatabase(input: ConnectionInput): Promise<boolean>;
  refreshCatalog(): Promise<void>;
  disconnect(): void;
  selectMode(mode: Mode): void;
};
const ConnectionContext = createContext<ConnectionState | null>(null);

/** Session tokens live in memory only and survive client-side route changes, not reloads. */
export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('browser');
  const [native, setNative] = useState<NativePostgresAdapter | null>(null);
  const [nativeSize, setNativeSize] = useState<DatasetSize>(100000);
  const [local, setLocal] = useState<DirectDatabaseClient | null>(null);
  const [catalog, setCatalog] = useState<DatabaseCatalog | null>(null);
  const [workspaceSession, setWorkspaceSession] = useState(createWorkspaceSession);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const adapterRef = useRef<{ dispose(): void } | null>(null);
  const pendingRef = useRef(false);
  useEffect(() => {
    const release = (event: PageTransitionEvent) => { if (!event.persisted) adapterRef.current?.dispose(); };
    window.addEventListener('pagehide', release);
    return () => { window.removeEventListener('pagehide', release); adapterRef.current?.dispose(); };
  }, []);

  const fail = (failure: unknown, fallback: string) => {
    setError(failure instanceof Error ? failure.message : fallback);
    setErrorCode(failure instanceof DirectDatabaseRequestError ? failure.code : 'unknown');
  };
  const disconnect = useCallback(() => {
    adapterRef.current?.dispose(); adapterRef.current = null;
    setNative(null); setLocal(null); setCatalog(null); setMode('browser'); setError(''); setErrorCode('');
    setWorkspaceSession(createWorkspaceSession());
  }, []);
  const updateWorkspaceSession = useCallback((adapter: WorkspaceAdapter | null, update: SetStateAction<WorkspaceSession>) => {
    if (adapter && adapterRef.current === adapter) setWorkspaceSession(update);
  }, []);
  const connectDatabase = useCallback(async (input: ConnectionInput) => {
    if (pendingRef.current || adapterRef.current) return false;
    pendingRef.current = true; setConnecting(true); setError(''); setErrorCode('');
    try {
      const { client, catalog: discovered } = await DirectDatabaseClient.connect(input);
      adapterRef.current = client; setLocal(client); setCatalog(discovered); setWorkspaceSession(createWorkspaceSession());
      return true;
    } catch (failure) { fail(failure, 'Could not connect to PostgreSQL.'); return false; }
    finally { pendingRef.current = false; setConnecting(false); }
  }, []);
  const refreshCatalog = useCallback(async () => {
    if (!local) throw new Error('Connect your PostgreSQL first.');
    const discovered = await local.inspectWorkspace();
    if (adapterRef.current === local) setCatalog(discovered);
  }, [local]);
  const connect = useCallback(async (code: string, size: DatasetSize, rebuild = false) => {
    if (pendingRef.current || adapterRef.current) return false;
    pendingRef.current = true; setConnecting(true); setError('');
    const adapter = new NativePostgresAdapter(code.trim().toUpperCase());
    try {
      const status = await adapter.connect();
      if (!status.connected) throw new Error('Connector is offline. Start it on your machine, then try a new pairing code.');
      if (rebuild) await adapter.reset(size); else await adapter.initialize(size);
      adapterRef.current = adapter; setNative(adapter); setNativeSize(size); setMode('native');
      return true;
    } catch (failure) { adapter.dispose(); fail(failure, 'Could not connect to PostgreSQL.'); return false; }
    finally { pendingRef.current = false; setConnecting(false); }
  }, []);
  const selectMode = useCallback((next: Mode) => {
    if (next === 'native' && !adapterRef.current) return;
    setMode(next);
  }, []);
  return <ConnectionContext.Provider value={{ mode, native, nativeSize, local, catalog, workspaceSession, updateWorkspaceSession, connecting, error, errorCode, connect, connectDatabase, refreshCatalog, disconnect, selectMode }}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const value = useContext(ConnectionContext);
  if (!value) throw new Error('useConnection requires ConnectionProvider.');
  return value;
}

export function useWorkspaceField<Key extends keyof WorkspaceSession>(key: Key): [WorkspaceSession[Key], Dispatch<SetStateAction<WorkspaceSession[Key]>>] {
  const { local, workspaceSession, updateWorkspaceSession } = useConnection();
  const setValue: Dispatch<SetStateAction<WorkspaceSession[Key]>> = value => updateWorkspaceSession(local, previous => ({
    ...previous, [key]: typeof value === 'function' ? value(previous[key]) : value,
  }));
  return [workspaceSession[key], setValue];
}
