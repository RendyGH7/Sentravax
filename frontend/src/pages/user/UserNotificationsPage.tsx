import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  AlertTriangle,
  Cpu,
  FileCheck2,
  AlertCircle,
  Info,
  SlidersHorizontal,
  X,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { notificationService } from '../../services/notification-service';
import type {
  InAppNotification,
  NotificationCategory,
  NotificationPreferences,
  NotificationUrgency
} from '../../types/notification';
import { PATHS } from '../../app/router/paths';

export const UserNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Pagination & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'warning' | 'report' | 'ai'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Preferences modal state
  const [isPrefModalOpen, setIsPrefModalOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enable_ai_insights: true,
    enable_official_warnings: true,
    enable_report_status: true,
    enable_disaster_alerts: true,
    enable_system: true,
    in_app_enabled: true,
    min_urgency: 'info'
  });
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        per_page: 15
      };

      if (activeTab === 'unread') {
        params.status = 'unread';
      } else if (activeTab === 'warning') {
        params.category = 'official_warning';
      } else if (activeTab === 'report') {
        params.category = 'report_status';
      } else if (activeTab === 'ai') {
        params.category = 'ai_insight';
      }

      if (urgencyFilter !== 'all') {
        params.urgency = urgencyFilter;
      }

      const res = await notificationService.getNotifications(params);
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.meta?.unread_count ?? 0);
        setTotalPages(res.meta?.last_page ?? 1);
        setTotalCount(res.meta?.total ?? 0);
      } else {
        setError('Gagal memuat daftar notifikasi.');
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err?.response?.data?.message || 'Terjadi kesalahan saat memuat notifikasi.');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, urgencyFilter]);

  // Load preferences
  const loadPreferences = async () => {
    try {
      const prefData = await notificationService.getPreferences();
      setPreferences(prefData);
    } catch {
      // Keep safe defaults
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    loadPreferences();
  }, []);

  // Mark single as read
  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(res.unread_count);
      toast.success('Notifikasi ditandai sudah dibaca.');
    } catch {
      toast.error('Gagal memperbarui status notifikasi.');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(res.unread_count);
      toast.success('Semua notifikasi berhasil ditandai telah dibaca.');
    } catch {
      toast.error('Gagal menandai seluruh notifikasi.');
    }
  };

  // Save Preferences
  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const updated = await notificationService.updatePreferences(preferences);
      setPreferences(updated);
      setIsPrefModalOpen(false);
      toast.success('Preferensi notifikasi berhasil disimpan.');
      // Reload list as preferences may alter incoming stream
      loadNotifications();
    } catch {
      toast.error('Gagal menyimpan preferensi.');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Category Icon & Badge
  const getCategoryBadge = (category: NotificationCategory) => {
    switch (category) {
      case 'official_warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Peringatan Resmi
          </span>
        );
      case 'disaster_alert':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertCircle className="w-3 h-3 text-orange-600" /> Siaga Bencana
          </span>
        );
      case 'ai_insight':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Cpu className="w-3 h-3 text-amber-600" /> AI Insight
          </span>
        );
      case 'report_status':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <FileCheck2 className="w-3 h-3 text-blue-600" /> Status Laporan
          </span>
        );
      case 'system':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <Info className="w-3 h-3 text-gray-500" /> Sistem
          </span>
        );
    }
  };

  // Urgency Tag
  const getUrgencyBadge = (urgency: NotificationUrgency) => {
    switch (urgency) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
            KRITIS
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white">
            TINGGI
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-300">
            SEDANG
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-700">
            RENDAH
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            INFO
          </span>
        );
    }
  };

  // Deep Link helper
  const renderDeepLink = (item: InAppNotification) => {
    if (!item.related_type || !item.related_id) return null;

    let targetUrl = '';
    let label = '';

    if (item.related_type === 'community_report' || item.category === 'report_status') {
      targetUrl = PATHS.USER.REPORTS;
      label = 'Buka Laporan Saya';
    } else if (item.related_type === 'ai_insight' || item.category === 'ai_insight') {
      targetUrl = PATHS.PUBLIC.MAP;
      label = 'Pantau Peta Intelijen';
    } else if (item.related_type === 'alert' || item.category === 'official_warning' || item.category === 'disaster_alert') {
      targetUrl = PATHS.PUBLIC.MAP;
      label = 'Lihat Peringatan di Peta';
    }

    if (!targetUrl) return null;

    return (
      <Link
        to={targetUrl}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#BE123C] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] transition-colors"
      >
        <span>{label}</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    );
  };

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0 max-w-full">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] animate-pulse"></span>
            <span className="text-xs font-mono uppercase text-[#BE123C] font-bold">
              Notification Engine Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#BE123C]" />
            Pusat Notifikasi & Riwayat Peringatan
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563]">
            Pemberitahuan peringatan resmi, peringatan bahaya, intelijen AI terverifikasi, dan status verifikasi laporan Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F9FAFB] text-[#374151] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-[#BE123C]" />
            <span>Tandai Semua Dibaca</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrefModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#BE123C] hover:bg-[#9F1239] text-white shadow-xs transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Preferensi</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Urgency Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFFFF] p-2 rounded-xl border border-[#E5E7EB] shadow-xs min-w-0 max-w-full">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 min-w-0 max-w-full">
          <button
            type="button"
            onClick={() => { setActiveTab('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#BE123C] text-white shadow-xs'
                : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('unread'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-[#BE123C] text-white shadow-xs'
                : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            <span>Belum Dibaca</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'unread' ? 'bg-white text-[#BE123C]' : 'bg-[#EF4444] text-white'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('warning'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'warning'
                ? 'bg-[#BE123C] text-white shadow-xs'
                : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            Peringatan Resmi
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('report'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'report'
                ? 'bg-[#BE123C] text-white shadow-xs'
                : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            Status Laporan
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('ai'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-[#BE123C] text-white shadow-xs'
                : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            AI Insights
          </button>
        </div>

        {/* Urgency Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0 px-2">
          <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
          <span className="text-xs text-[#6B7280] font-medium hidden md:inline">Urgensi:</span>
          <select
            value={urgencyFilter}
            onChange={(e) => { setUrgencyFilter(e.target.value); setPage(1); }}
            className="text-xs font-semibold bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#374151] focus:outline-hidden focus:ring-1 focus:ring-[#BE123C]"
          >
            <option value="all">Semua Urgensi</option>
            <option value="critical">Kritis</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-[#E5E7EB] rounded w-1/4"></div>
                <div className="h-4 bg-[#E5E7EB] rounded w-1/6"></div>
              </div>
              <div className="h-4 bg-[#F3F4F6] rounded w-3/4"></div>
              <div className="h-3 bg-[#F3F4F6] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#DC2626] mx-auto" />
          <h3 className="text-sm font-bold text-[#991B1B]">Gagal Memuat Notifikasi</h3>
          <p className="text-xs text-[#B91C1C] max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={loadNotifications}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#111827]">Tidak Ada Notifikasi</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            {activeTab === 'unread'
              ? 'Seluruh notifikasi telah Anda baca. Situasi pemantauan terkini aman.'
              : 'Belum ada notifikasi baru untuk kategori atau filter yang dipilih.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            const isUnread = !item.is_read && !item.read_at;
            const createdAtFormatted = new Date(item.created_at).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isUnread
                    ? 'bg-[#FFFFFF] border-[#FECDD3] ring-1 ring-[#F43F5E]/20 hover:border-[#34D399]'
                    : 'bg-[#FFFFFF] border-[#E5E7EB] opacity-90 hover:opacity-100 hover:border-[#D1D5DB]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    {/* Badge Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#F43F5E] animate-pulse" title="Belum dibaca"></span>
                      )}
                      {getCategoryBadge(item.category)}
                      {getUrgencyBadge(item.urgency)}
                      <span className="text-[11px] text-[#6B7280] font-mono">
                        {createdAtFormatted}
                      </span>
                    </div>

                    {/* Title & Body */}
                    <h3 className={`text-sm tracking-tight ${isUnread ? 'font-bold text-[#111827]' : 'font-semibold text-[#374151]'}`}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed whitespace-pre-line">
                      {item.body}
                    </p>

                    {/* Deep link button if applicable */}
                    <div className="pt-1">
                      {renderDeepLink(item)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:self-start shrink-0 pt-2 sm:pt-0">
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#BE123C] hover:bg-[#FFF1F2] border border-transparent hover:border-[#FECDD3] transition-colors"
                        title="Tandai telah dibaca"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tandai Dibaca</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1 font-medium px-2 py-1">
                        <CheckCheck className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        Dibaca
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-xs">
          <p className="text-xs text-[#6B7280]">
            Halaman <span className="font-bold text-[#111827]">{page}</span> dari <span className="font-bold text-[#111827]">{totalPages}</span> ({totalCount} total notifikasi)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Halaman selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {isPrefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">Preferensi Notifikasi</h3>
                  <p className="text-[11px] text-[#6B7280]">Kelola saluran dan kategori notifikasi yang ingin Anda terima.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrefModalOpen(false)}
                className="p-1.5 text-[#9CA3AF] hover:text-[#111827] rounded-lg hover:bg-[#E5E7EB] transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Master Channel Toggle */}
              <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#9F1239] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#BE123C]" />
                    Saluran In-App SENTRAVAX
                  </h4>
                  <p className="text-[11px] text-[#BE123C]">Notifikasi di dalam portal aplikasi web.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.in_app_enabled}
                    onChange={(e) => setPreferences({ ...preferences, in_app_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BE123C]"></div>
                </label>
              </div>

              {/* Category Switches */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Kategori Notifikasi
                </h4>

                {/* Official Warnings */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                  <div>
                    <h5 className="text-xs font-bold text-[#111827]">Peringatan Resmi (Official Warning)</h5>
                    <p className="text-[11px] text-[#6B7280]">Peringatan dari BMKG, PVMBG, dan instansi resmi terverifikasi.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enable_official_warnings}
                      onChange={(e) => setPreferences({ ...preferences, enable_official_warnings: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BE123C]"></div>
                  </label>
                </div>

                {/* AI Insights */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                  <div>
                    <h5 className="text-xs font-bold text-[#111827]">AI Proactive Insights</h5>
                    <p className="text-[11px] text-[#6B7280]">Analisis dini dan pola pergerakan risiko dari engine AI.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enable_ai_insights}
                      onChange={(e) => setPreferences({ ...preferences, enable_ai_insights: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BE123C]"></div>
                  </label>
                </div>

                {/* Report Status */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                  <div>
                    <h5 className="text-xs font-bold text-[#111827]">Status Laporan Bencana</h5>
                    <p className="text-[11px] text-[#6B7280]">Pembaruan hasil verifikasi atas laporan yang Anda kirimkan.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enable_report_status}
                      onChange={(e) => setPreferences({ ...preferences, enable_report_status: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BE123C]"></div>
                  </label>
                </div>

                {/* Disaster Alerts */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                  <div>
                    <h5 className="text-xs font-bold text-[#111827]">Peringatan Darurat Lokal</h5>
                    <p className="text-[11px] text-[#6B7280]">Notifikasi eskalasi kejadian bahaya di wilayah tersimpan.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enable_disaster_alerts}
                      onChange={(e) => setPreferences({ ...preferences, enable_disaster_alerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BE123C]"></div>
                  </label>
                </div>

                {/* System */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                  <div>
                    <h5 className="text-xs font-bold text-[#111827]">Pemberitahuan Sistem & Operasional</h5>
                    <p className="text-[11px] text-[#6B7280]">Informasi pemeliharaan platform dan sinkronisasi.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.enable_system}
                      onChange={(e) => setPreferences({ ...preferences, enable_system: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BE123C]"></div>
                  </label>
                </div>
              </div>

              {/* Urgency Threshold */}
              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Ambang Batas Minimum Urgensi
                </h4>
                <p className="text-[11px] text-[#6B7280]">
                  Hanya notifikasi dengan tingkat urgensi sama atau lebih tinggi yang akan dikirimkan.
                </p>
                <select
                  value={preferences.min_urgency}
                  onChange={(e) => setPreferences({ ...preferences, min_urgency: e.target.value })}
                  className="w-full text-xs font-semibold bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-2.5 text-[#111827] focus:outline-hidden focus:ring-1 focus:ring-[#BE123C]"
                >
                  <option value="info">Info (Terima Semua: Info, Sedang, Tinggi, Kritis)</option>
                  <option value="advisory">Advisory / Waspada Ringan</option>
                  <option value="watch">Watch / Siaga Sedang</option>
                  <option value="warning">Warning / Kritis Saja</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsPrefModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-[#E5E7EB] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingPrefs}
                onClick={handleSavePreferences}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#BE123C] hover:bg-[#9F1239] text-white disabled:opacity-50 transition-colors shadow-xs"
              >
                {savingPrefs ? 'Menyimpan...' : 'Simpan Preferensi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
