import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  User as UserIcon,
  Filter,
} from 'lucide-react';
import { adminService } from '../../services/admin-service';
import { getApiErrorMessage, isRequestCanceled } from '../../lib/api-error';
import type {
  AdminEmergencyAuditLogItem,
  AdminEmergencyAuditQueryParams,
  EmergencyDirectoryAuditEntityType,
  PublicEmergencyDirectoryPaginationMeta,
} from '../../types/emergency-directory';

const AUDIT_ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'contact_created', label: 'contact_created' },
  { value: 'contact_updated', label: 'contact_updated' },
  { value: 'contact_verification_changed', label: 'contact_verification_changed' },
  { value: 'contact_publication_changed', label: 'contact_publication_changed' },
  { value: 'contact_soft_deleted', label: 'contact_soft_deleted' },
  { value: 'channel_created', label: 'channel_created' },
  { value: 'channel_updated', label: 'channel_updated' },
  { value: 'channel_verification_changed', label: 'channel_verification_changed' },
  { value: 'channel_activated', label: 'channel_activated' },
  { value: 'channel_deactivated', label: 'channel_deactivated' },
  { value: 'channel_primary_promoted', label: 'channel_primary_promoted' },
  { value: 'channel_primary_demoted', label: 'channel_primary_demoted' },
  { value: 'channel_deactivated_via_delete', label: 'channel_deactivated_via_delete' },
  { value: 'contact_publication_auto_demoted_due_to_channel', label: 'auto_demoted_due_to_channel' },
  { value: 'contact_publication_auto_demoted_due_to_verification', label: 'auto_demoted_due_to_verification' },
];

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatSnapshotValue(val: unknown, keyPresent: boolean): React.ReactNode {
  if (!keyPresent) {
    return <span className="text-[#737373] italic">(tidak ada field)</span>;
  }
  if (val === null) {
    return <span className="px-1 py-0.5 rounded bg-[#262626] text-[#FBBF24] font-mono text-[10px]">null</span>;
  }
  if (val === '') {
    return <span className="px-1 py-0.5 rounded bg-[#262626] text-[#A3A3A3] italic text-[10px]">"" (string kosong)</span>;
  }
  if (typeof val === 'boolean') {
    return <span className="font-mono text-[#38BDF8]">{val ? 'true' : 'false'}</span>;
  }
  if (typeof val === 'object') {
    return <span className="font-mono text-[#D4D4D4] break-all">{JSON.stringify(val)}</span>;
  }
  return <span className="font-mono text-[#E5E5E5] break-all">{String(val)}</span>;
}

export interface AdminEmergencyAuditHistoryPanelProps {
  contactId?: number;
  canViewAudit: boolean;
  refreshTrigger?: number;
}

export const AdminEmergencyAuditHistoryPanel: React.FC<AdminEmergencyAuditHistoryPanelProps> = ({
  contactId,
  canViewAudit,
  refreshTrigger = 0,
}) => {
  const isContactScoped = typeof contactId === 'number';

  const [logs, setLogs] = useState<AdminEmergencyAuditLogItem[]>([]);
  const [meta, setMeta] = useState<PublicEmergencyDirectoryPaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Server-side filters
  const [entityType, setEntityType] = useState<EmergencyDirectoryAuditEntityType | ''>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityIdInput, setEntityIdInput] = useState<string>('');
  const [parentIdInput, setParentIdInput] = useState<string>('');
  const [actorIdInput, setActorIdInput] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!canViewAudit) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const baseParams: AdminEmergencyAuditQueryParams = {
      per_page: isContactScoped ? 10 : 20,
      page,
    };
    if (entityType) baseParams.entity_type = entityType;
    if (actionFilter) baseParams.action = actionFilter;
    if (dateFrom) baseParams.date_from = dateFrom;
    if (dateTo) baseParams.date_to = dateTo;

    if (!isContactScoped) {
      const eId = Number.parseInt(entityIdInput, 10);
      const pId = Number.parseInt(parentIdInput, 10);
      const aId = Number.parseInt(actorIdInput, 10);
      if (Number.isFinite(eId) && eId > 0) baseParams.entity_id = eId;
      if (Number.isFinite(pId) && pId > 0) baseParams.parent_contact_id = pId;
      if (Number.isFinite(aId) && aId > 0) baseParams.actor_id = aId;
    }

    const fetchAuditLogs = async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;

      setLoading(true);
      setError(null);
      setForbidden(false);

      try {
        const res = isContactScoped
          ? await adminService.getEmergencyContactAuditLogs(contactId, baseParams, controller.signal)
          : await adminService.getEmergencyDirectoryAuditLogs(baseParams, controller.signal);

        if (!controller.signal.aborted) {
          setLogs(res.data);
          setMeta(res.meta);
        }
      } catch (err: unknown) {
        if (isRequestCanceled(err)) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          setForbidden(true);
        }
        setError(getApiErrorMessage(err, 'Gagal memuat riwayat audit Emergency Directory.'));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchAuditLogs();
    return () => controller.abort();
  }, [
    canViewAudit,
    isContactScoped,
    contactId,
    page,
    entityType,
    actionFilter,
    entityIdInput,
    parentIdInput,
    actorIdInput,
    dateFrom,
    dateTo,
    reloadNonce,
    refreshTrigger,
  ]);

  const resetFilters = () => {
    setEntityType('');
    setActionFilter('');
    setEntityIdInput('');
    setParentIdInput('');
    setActorIdInput('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  if (!canViewAudit) {
    return (
      <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-2.5 text-xs text-[#A3A3A3]">
        <Lock className="w-4 h-4 text-[#FBBF24] shrink-0" />
        <span>Riwayat audit Emergency Directory hanya dapat diakses oleh role Admin.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3 border-t border-[#262626]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {isContactScoped
                ? `Riwayat Audit Kontak & Channel (${meta.total})`
                : `Riwayat Audit Global Emergency Directory (${meta.total})`}
            </span>
          </h3>
          <p className="text-[11px] text-[#8A8A8A]">
            Catatan bersifat immutable (tidak dapat diubah atau dihapus). Diurutkan terbaru lebih dulu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReloadNonce((n) => n + 1)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#262626] border border-[#343434] text-[11px] font-medium text-[#D4D4D4] cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Server-side Filters */}
      <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#A3A3A3]">
          <span className="inline-flex items-center gap-1 font-semibold">
            <Filter className="w-3 h-3" />
            Filter Server Audit
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="text-rose-400 hover:underline cursor-pointer"
          >
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value as EmergencyDirectoryAuditEntityType | '');
              setPage(1);
            }}
            aria-label="Filter Entity Type"
            className="px-2.5 py-1.5 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
          >
            <option value="">Semua Entitas</option>
            <option value="emergency_contact">emergency_contact (Parent)</option>
            <option value="emergency_contact_channel">emergency_contact_channel</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter Aksi Audit"
            className="px-2.5 py-1.5 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
          >
            <option value="">Semua Aksi</option>
            {AUDIT_ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            aria-label="Tanggal Mulai"
            title="Tanggal Mulai (date_from)"
            className="px-2.5 py-1.5 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            aria-label="Tanggal Akhir"
            title="Tanggal Akhir (date_to)"
            className="px-2.5 py-1.5 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
          />

          {!isContactScoped && (
            <>
              <input
                type="number"
                min={1}
                placeholder="Parent Contact ID"
                value={parentIdInput}
                onChange={(e) => {
                  setParentIdInput(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              />
              <input
                type="number"
                min={1}
                placeholder="Entity ID"
                value={entityIdInput}
                onChange={(e) => {
                  setEntityIdInput(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              />
              <input
                type="number"
                min={1}
                placeholder="Actor ID"
                value={actorIdInput}
                onChange={(e) => {
                  setActorIdInput(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              />
            </>
          )}
        </div>
      </div>

      {/* States: Error / Loading / Empty / List */}
      {error ? (
        <div className="p-4 rounded-xl bg-[#2A1215] border border-[#7F1D1D] text-xs text-[#FCA5A5] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{forbidden ? 'Akses audit ditolak (403).' : error}</span>
          </div>
          {!forbidden && (
            <button
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              className="px-2.5 py-1 rounded bg-[#7F1D1D]/60 text-white font-semibold cursor-pointer"
            >
              Coba Lagi
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="p-6 rounded-xl bg-[#141414] border border-[#262626] text-center text-xs text-[#A3A3A3]">
          Memuat catatan audit dari server...
        </div>
      ) : logs.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#141414] border border-[#262626] text-center text-xs text-[#8A8A8A]">
          Belum ada catatan audit yang sesuai filter.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const oldObj = log.old_values ?? {};
            const newObj = log.new_values ?? {};
            const diffKeys = Array.from(
              new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
            );

            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#141414] border border-[#262626] space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 font-mono text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#212121] border border-[#343434] font-mono text-[10px] text-[#D4D4D4]">
                      {log.entity_type} #{log.entity_id}
                    </span>
                    {log.parent_contact ? (
                      <span className="text-[11px] text-[#A3A3A3]">
                        Parent: <strong className="text-[#F5F5F5]">{log.parent_contact.name}</strong> (#{log.parent_contact_id})
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#A3A3A3]">
                        Parent #{log.parent_contact_id}
                      </span>
                    )}
                  </div>

                  <span
                    className="text-[11px] font-mono text-[#8A8A8A]"
                    title={log.created_at}
                  >
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#A3A3A3]">
                  <UserIcon className="w-3 h-3 text-[#8A8A8A]" />
                  {log.actor ? (
                    <span>
                      {log.actor.name} (<span className="font-mono">{log.actor.email}</span>)
                    </span>
                  ) : (
                    <span className="italic text-[#8A8A8A]">Aktor tidak tersedia</span>
                  )}
                </div>

                {diffKeys.length > 0 && (
                  <div className="rounded-lg bg-[#0D0D0D] border border-[#222222] p-2.5 space-y-1">
                    {diffKeys.map((key) => {
                      const hasOld = Object.prototype.hasOwnProperty.call(oldObj, key);
                      const hasNew = Object.prototype.hasOwnProperty.call(newObj, key);
                      return (
                        <div
                          key={key}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-1 text-[11px] items-start"
                        >
                          <span className="sm:col-span-3 font-mono font-semibold text-[#D4D4D4]">
                            {key}
                          </span>
                          <div className="sm:col-span-4 text-[#A3A3A3]">
                            <span className="text-[10px] text-[#737373] mr-1">Sebelum:</span>
                            {formatSnapshotValue(oldObj[key], hasOld)}
                          </div>
                          <div className="sm:col-span-5 text-[#E5E5E5]">
                            <span className="text-[10px] text-[#737373] mr-1">Sesudah:</span>
                            {formatSnapshotValue(newObj[key], hasNew)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between text-[11px] text-[#A3A3A3] pt-1">
          <span>
            Halaman {meta.current_page} dari {meta.last_page} (Total {meta.total})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={meta.current_page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-[#1C1C1C] border border-[#343434] disabled:opacity-40 cursor-pointer"
              aria-label="Halaman audit sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page || loading}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              className="p-1.5 rounded-lg bg-[#1C1C1C] border border-[#343434] disabled:opacity-40 cursor-pointer"
              aria-label="Halaman audit berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmergencyAuditHistoryPanel;
