import React, { useState } from 'react';
import {
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Hash,
  Plus,
  Edit2,
  ShieldCheck,
  Power,
  Star,
  Archive,
  AlertCircle,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../../services/admin-service';
import { getApiErrorMessage } from '../../lib/api-error';
import { Modal } from '../ui/Modal';
import type {
  AdminEmergencyContact,
  AdminEmergencyContactChannel,
  AdminEmergencyChannelCreatePayload,
  AdminEmergencyChannelUpdatePayload,
  EmergencyDirectoryChannelType,
  EmergencyDirectoryChannelClassification,
  EmergencyDirectoryVerificationStatus,
} from '../../types/emergency-directory';

const CHANNEL_TYPE_OPTIONS: Array<{ value: EmergencyDirectoryChannelType; label: string }> = [
  { value: 'phone', label: 'Telepon (Phone)' },
  { value: 'shortcode', label: 'Shortcode (110 / 115 / 119)' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website / Portal' },
];

const CLASSIFICATION_OPTIONS: Array<{
  value: EmergencyDirectoryChannelClassification;
  label: string;
  hint: string;
}> = [
  {
    value: 'emergency_hotline',
    label: 'Hotline Darurat',
    hint: 'Khusus nomor panggilan gawat darurat publik 1-klik.',
  },
  {
    value: 'operational_contact',
    label: 'Kontak Operasional',
    hint: 'Nomor posko, call center non-darurat, atau koordinasi teknis.',
  },
  {
    value: 'office_contact',
    label: 'Kontak Kantor',
    hint: 'Nomor administrasi atau sekretariat instansi.',
  },
  {
    value: 'informational_contact',
    label: 'Informasi Umum',
    hint: 'Website, email layanan publik, atau kanal informasi.',
  },
];

const VERIFICATION_STATUS_OPTIONS: Array<{
  value: EmergencyDirectoryVerificationStatus;
  label: string;
}> = [
  { value: 'verified', label: 'Verified (Terverifikasi)' },
  { value: 'unverified', label: 'Unverified (Belum Diverifikasi)' },
  { value: 'source_unavailable', label: 'Source Unavailable (Sumber Tidak Tersedia)' },
  { value: 'rejected', label: 'Rejected (Ditolak)' },
];

function getChannelTypeIcon(type: EmergencyDirectoryChannelType) {
  switch (type) {
    case 'shortcode':
      return <Hash className="w-3.5 h-3.5 text-rose-400" />;
    case 'whatsapp':
      return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
    case 'email':
      return <Mail className="w-3.5 h-3.5 text-sky-400" />;
    case 'website':
      return <Globe className="w-3.5 h-3.5 text-purple-400" />;
    case 'phone':
    default:
      return <Phone className="w-3.5 h-3.5 text-amber-400" />;
  }
}

function getClassificationBadge(classification: EmergencyDirectoryChannelClassification) {
  switch (classification) {
    case 'emergency_hotline':
      return {
        label: 'Hotline Darurat',
        classes: 'bg-rose-950/70 text-rose-300 border-rose-800/70',
      };
    case 'operational_contact':
      return {
        label: 'Kontak Operasional',
        classes: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
      };
    case 'office_contact':
      return {
        label: 'Kontak Kantor',
        classes: 'bg-[#212121] text-[#D4D4D4] border-[#383838]',
      };
    case 'informational_contact':
    default:
      return {
        label: 'Informasi Umum',
        classes: 'bg-[#212121] text-[#A3A3A3] border-[#343434]',
      };
  }
}

function getVerificationBadge(status: EmergencyDirectoryVerificationStatus) {
  switch (status) {
    case 'verified':
      return 'bg-[#064E3B]/60 text-[#34D399] border-[#065F46]';
    case 'unverified':
      return 'bg-[#2E2208] text-[#FBBF24] border-[#78350F]';
    case 'source_unavailable':
      return 'bg-[#262626] text-[#D4D4D4] border-[#404040]';
    case 'rejected':
      return 'bg-[#450A0A]/70 text-[#F87171] border-[#7F1D1D]';
    default:
      return 'bg-[#212121] text-[#A3A3A3] border-[#343434]';
  }
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function extractFieldErrors(err: unknown): Record<string, string[]> {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const resp = (err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }).response;
    if (resp?.status === 422 && resp.data?.errors) {
      return resp.data.errors;
    }
  }
  return {};
}

interface ChannelFormState {
  channel_type: EmergencyDirectoryChannelType;
  channel_classification: EmergencyDirectoryChannelClassification;
  label: string;
  value: string;
  is_toll_free: boolean;
  is_primary: boolean;
  operating_hours: string;
  source_name: string;
  source_url: string;
  verification_notes: string;
  sort_order: string;
  is_active: boolean;
}

const EMPTY_CHANNEL_FORM: ChannelFormState = {
  channel_type: 'phone',
  channel_classification: 'operational_contact',
  label: '',
  value: '',
  is_toll_free: false,
  is_primary: false,
  operating_hours: '',
  source_name: '',
  source_url: '',
  verification_notes: '',
  sort_order: '0',
  is_active: false,
};

interface VerifyFormState {
  verification_status: EmergencyDirectoryVerificationStatus;
  source_name: string;
  source_url: string;
  verification_notes: string;
  confirmed: boolean;
}

type ConfirmAction =
  | { type: 'toggle'; channel: AdminEmergencyContactChannel }
  | { type: 'primary'; channel: AdminEmergencyContactChannel }
  | { type: 'archive'; channel: AdminEmergencyContactChannel };

export interface AdminEmergencyChannelsSectionProps {
  contact: AdminEmergencyContact;
  canMutate: boolean;
  loading?: boolean;
  onRefreshContact: () => Promise<void>;
}

export const AdminEmergencyChannelsSection: React.FC<AdminEmergencyChannelsSectionProps> = ({
  contact,
  canMutate,
  loading = false,
  onRefreshContact,
}) => {
  const channels = contact.channels ?? [];

  // Create / Edit modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<AdminEmergencyContactChannel | null>(null);
  const [formState, setFormState] = useState<ChannelFormState>(EMPTY_CHANNEL_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Verification modal state
  const [verifyTarget, setVerifyTarget] = useState<AdminEmergencyContactChannel | null>(null);
  const [verifyState, setVerifyState] = useState<VerifyFormState>({
    verification_status: 'unverified',
    source_name: '',
    source_url: '',
    verification_notes: '',
    confirmed: false,
  });
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyFieldErrors, setVerifyFieldErrors] = useState<Record<string, string[]>>({});

  // Confirm modal for toggle / primary / archive
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingChannel(null);
    setFormState(EMPTY_CHANNEL_FORM);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditModal = (ch: AdminEmergencyContactChannel) => {
    setEditingChannel(ch);
    setFormState({
      channel_type: ch.channel_type,
      channel_classification: ch.channel_classification,
      label: ch.label,
      value: ch.value,
      is_toll_free: Boolean(ch.is_toll_free),
      is_primary: Boolean(ch.is_primary),
      operating_hours: ch.operating_hours || '',
      source_name: ch.source_name || '',
      source_url: ch.source_url || '',
      verification_notes: ch.verification_notes || '',
      sort_order: String(ch.sort_order ?? 0),
      is_active: Boolean(ch.is_active),
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openVerifyModal = (ch: AdminEmergencyContactChannel) => {
    setVerifyTarget(ch);
    setVerifyState({
      verification_status: ch.verification_status,
      source_name: ch.source_name || '',
      source_url: ch.source_url || '',
      verification_notes: ch.verification_notes || '',
      confirmed: false,
    });
    setVerifyError(null);
    setVerifyFieldErrors({});
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitting) return;

    const clientErrors: Record<string, string[]> = {};
    if (!formState.label.trim()) clientErrors.label = ['Label channel wajib diisi.'];
    if (!formState.value.trim()) clientErrors.value = ['Nilai channel (nomor/email/URL) wajib diisi.'];
    if (!formState.source_name.trim()) clientErrors.source_name = ['Nama sumber resmi wajib diisi.'];
    if (!formState.source_url.trim()) {
      clientErrors.source_url = ['URL sumber resmi wajib diisi.'];
    } else {
      try {
        new URL(formState.source_url.trim());
      } catch {
        clientErrors.source_url = ['Format URL sumber harus valid (contoh: https://...).'];
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setFormError('Periksa kembali isian formulir channel.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const parsedSort = Number.parseInt(formState.sort_order, 10);

    try {
      if (editingChannel === null) {
        const payload: AdminEmergencyChannelCreatePayload = {
          channel_type: formState.channel_type,
          channel_classification: formState.channel_classification,
          label: formState.label.trim(),
          value: formState.value.trim(),
          is_toll_free: formState.is_toll_free,
          is_primary: formState.is_primary,
          operating_hours: formState.operating_hours.trim() || null,
          verification_status: 'unverified',
          source_name: formState.source_name.trim(),
          source_url: formState.source_url.trim(),
          verification_notes: formState.verification_notes.trim() || null,
          sort_order: Number.isFinite(parsedSort) ? parsedSort : 0,
          is_active: formState.is_active,
        };
        await adminService.createEmergencyChannel(contact.id, payload);
        toast.success('Channel kontak berhasil ditambahkan (status default: unverified).');
      } else {
        // Generic edit preserves verification metadata; verification uses dedicated workflow
        const payload: AdminEmergencyChannelUpdatePayload = {
          channel_type: formState.channel_type,
          channel_classification: formState.channel_classification,
          label: formState.label.trim(),
          value: formState.value.trim(),
          is_toll_free: formState.is_toll_free,
          operating_hours: formState.operating_hours.trim() || null,
          source_name: formState.source_name.trim(),
          source_url: formState.source_url.trim(),
          sort_order: Number.isFinite(parsedSort) ? parsedSort : 0,
        };
        await adminService.updateEmergencyChannel(contact.id, editingChannel.id, payload);
        toast.success('Atribut channel berhasil diperbarui.');
      }

      setFormOpen(false);
      await onRefreshContact();
    } catch (err: unknown) {
      const fErrs = extractFieldErrors(err);
      if (Object.keys(fErrs).length > 0) {
        setFieldErrors(fErrs);
      }
      setFormError(getApiErrorMessage(err, 'Gagal menyimpan data channel.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTarget || verifySubmitting) return;

    const clientErrors: Record<string, string[]> = {};
    if (!verifyState.source_name.trim()) clientErrors.source_name = ['Nama sumber bukti wajib diisi.'];
    if (!verifyState.source_url.trim()) {
      clientErrors.source_url = ['URL sumber bukti wajib diisi.'];
    } else {
      try {
        new URL(verifyState.source_url.trim());
      } catch {
        clientErrors.source_url = ['Format URL sumber harus valid (contoh: https://...).'];
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setVerifyFieldErrors(clientErrors);
      setVerifyError('Bukti sumber resmi wajib lengkap sebelum mengubah status verifikasi.');
      return;
    }

    if (!verifyState.confirmed) {
      setVerifyError('Centang konfirmasi pemeriksaan bukti sumber terlebih dahulu.');
      return;
    }

    setVerifySubmitting(true);
    setVerifyError(null);
    setVerifyFieldErrors({});

    try {
      await adminService.verifyEmergencyChannel(contact.id, verifyTarget.id, {
        verification_status: verifyState.verification_status,
        source_name: verifyState.source_name.trim(),
        source_url: verifyState.source_url.trim(),
        verification_notes: verifyState.verification_notes.trim() || null,
      });
      toast.success(`Status verifikasi channel diperbarui ke "${verifyState.verification_status}".`);
      setVerifyTarget(null);
      await onRefreshContact();
    } catch (err: unknown) {
      const fErrs = extractFieldErrors(err);
      if (Object.keys(fErrs).length > 0) {
        setVerifyFieldErrors(fErrs);
      }
      setVerifyError(getApiErrorMessage(err, 'Gagal memperbarui status verifikasi channel.'));
    } finally {
      setVerifySubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || actionSubmitting) return;
    setActionSubmitting(true);

    try {
      if (confirmAction.type === 'toggle') {
        const res = await adminService.toggleEmergencyChannelActive(
          contact.id,
          confirmAction.channel.id
        );
        toast.success(res.message);
      } else if (confirmAction.type === 'primary') {
        const res = await adminService.setPrimaryEmergencyChannel(
          contact.id,
          confirmAction.channel.id
        );
        toast.success(res.message);
      } else if (confirmAction.type === 'archive') {
        const res = await adminService.deactivateEmergencyChannel(
          contact.id,
          confirmAction.channel.id
        );
        toast.success(res.message);
      }
      setConfirmAction(null);
      await onRefreshContact();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Operasi channel gagal dijalankan.'));
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-[#262626]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
            Kanal Komunikasi ({channels.length})
          </h3>
          <p className="text-[11px] text-[#8A8A8A]">
            Kelola hotline darurat, kontak operasional, email, dan kanal resmi instansi.
          </p>
        </div>
        {canMutate ? (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Channel</span>
          </button>
        ) : (
          <span className="text-[11px] text-[#8A8A8A] px-2.5 py-1 rounded-md bg-[#161616] border border-[#2C2C2C]">
            Mode Baca (Read-only)
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-6 rounded-xl bg-[#141414] border border-[#262626] text-center text-xs text-[#A3A3A3]">
          Memuat daftar channel...
        </div>
      ) : channels.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#141414] border border-[#262626] text-center space-y-1.5">
          <p className="text-xs font-semibold text-[#D4D4D4]">Belum ada channel terdaftar</p>
          <p className="text-[11px] text-[#8A8A8A]">
            Tambahkan kanal komunikasi resmi dan lakukan verifikasi sumber sebelum dipublikasikan.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {channels.map((ch) => {
            const classInfo = getClassificationBadge(ch.channel_classification);
            const isVerified = ch.verification_status === 'verified';
            const isUnavailableToPublic = !ch.is_active || !isVerified;

            return (
              <div
                key={ch.id}
                className={`p-3.5 rounded-xl border transition-colors ${
                  ch.is_active
                    ? 'bg-[#141414] border-[#2C2C2C]'
                    : 'bg-[#111111] border-[#242424] opacity-80'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getChannelTypeIcon(ch.channel_type)}
                      <span className="font-semibold text-xs text-[#F5F5F5]">{ch.label}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#212121] border border-[#343434] text-[10px] font-mono text-[#D4D4D4] uppercase">
                        {ch.channel_type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${classInfo.classes}`}
                      >
                        {classInfo.label}
                      </span>
                      {ch.is_primary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/60 text-[10px] font-bold">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Primary
                        </span>
                      )}
                      {ch.is_toll_free && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold">
                          Bebas Pulsa
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-mono font-bold text-[#F5F5F5] break-all">
                      {ch.value}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getVerificationBadge(
                        ch.verification_status
                      )}`}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {ch.verification_status}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                        ch.is_active
                          ? 'bg-[#064E3B]/50 text-[#34D399] border-[#065F46]'
                          : 'bg-[#262626] text-[#A3A3A3] border-[#383838]'
                      }`}
                    >
                      {ch.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                {/* Metadata row */}
                <div className="mt-2.5 pt-2 border-t border-[#222222] grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#A3A3A3]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[#8A8A8A]">Sumber:</span>
                    <span className="truncate text-[#D4D4D4]">{ch.source_name || '-'}</span>
                    {ch.source_url && (
                      <a
                        href={ch.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-400 hover:underline inline-flex items-center gap-0.5 shrink-0"
                        title={ch.source_url}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#8A8A8A] shrink-0" />
                    <span>Jam: {ch.operating_hours || '-'}</span>
                    <span className="text-[#525252]">|</span>
                    <span>Verifikasi: {formatDateTime(ch.verified_at)}</span>
                  </div>
                  {ch.verification_notes && (
                    <div className="sm:col-span-2 text-[11px] text-[#A3A3A3] bg-[#181818] px-2.5 py-1.5 rounded-lg border border-[#262626]">
                      <span className="font-semibold text-[#D4D4D4]">Catatan: </span>
                      {ch.verification_notes}
                    </div>
                  )}
                  {isUnavailableToPublic && (
                    <div className="sm:col-span-2 text-[10px] text-[#FBBF24]">
                      Tidak ditampilkan ke publik karena{' '}
                      {!ch.is_active ? 'status nonaktif' : 'belum terverifikasi'}.
                    </div>
                  )}
                </div>

                {/* Admin action bar */}
                {canMutate && (
                  <div className="mt-2.5 pt-2 border-t border-[#222222] flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(ch)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1C1C1C] hover:bg-[#262626] border border-[#343434] text-[11px] font-medium text-[#D4D4D4] cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openVerifyModal(ch)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1C1C1C] hover:bg-[#262626] border border-[#343434] text-[11px] font-medium text-[#34D399] cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verifikasi</span>
                    </button>
                    {!ch.is_primary && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'primary', channel: ch })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1C1C1C] hover:bg-[#262626] border border-[#343434] text-[11px] font-medium text-amber-300 cursor-pointer"
                      >
                        <Star className="w-3 h-3" />
                        <span>Jadikan Primary</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ type: 'toggle', channel: ch })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1C1C1C] hover:bg-[#262626] border border-[#343434] text-[11px] font-medium text-[#D4D4D4] cursor-pointer"
                    >
                      <Power className="w-3 h-3" />
                      <span>{ch.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>
                    {ch.is_active && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'archive', channel: ch })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1C1C1C] hover:bg-[#2A1215] border border-[#343434] hover:border-[#7F1D1D] text-[11px] font-medium text-[#F87171] cursor-pointer ml-auto"
                      >
                        <Archive className="w-3 h-3" />
                        <span>Arsipkan</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT CHANNEL MODAL */}
      <Modal
        isOpen={formOpen}
        onClose={() => !formSubmitting && setFormOpen(false)}
        title={editingChannel ? 'Edit Atribut Channel' : 'Tambah Channel Komunikasi'}
        description={
          editingChannel
            ? 'Memperbarui atribut operasional tanpa menimpa status verifikasi.'
            : 'Channel baru disimpan sebagai unverified secara default.'
        }
        size="lg"
        theme="dark"
        closeOnBackdropClick={!formSubmitting}
      >
        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-[#2A1215] border border-[#7F1D1D] text-[#FCA5A5] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="ch-type" className="block font-semibold text-[#D4D4D4]">
                Tipe Channel <span className="text-[#F87171]">*</span>
              </label>
              <select
                id="ch-type"
                value={formState.channel_type}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    channel_type: e.target.value as EmergencyDirectoryChannelType,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              >
                {CHANNEL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.channel_type && (
                <p className="text-[11px] text-[#F87171]">{fieldErrors.channel_type[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="ch-class" className="block font-semibold text-[#D4D4D4]">
                Klasifikasi <span className="text-[#F87171]">*</span>
              </label>
              <select
                id="ch-class"
                value={formState.channel_classification}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    channel_classification: e.target.value as EmergencyDirectoryChannelClassification,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              >
                {CLASSIFICATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#8A8A8A]">
                {CLASSIFICATION_OPTIONS.find((o) => o.value === formState.channel_classification)?.hint}
              </p>
              {fieldErrors.channel_classification && (
                <p className="text-[11px] text-[#F87171]">{fieldErrors.channel_classification[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="ch-label" className="block font-semibold text-[#D4D4D4]">
                Label Channel <span className="text-[#F87171]">*</span>
              </label>
              <input
                id="ch-label"
                type="text"
                maxLength={150}
                value={formState.label}
                onChange={(e) => setFormState((s) => ({ ...s, label: e.target.value }))}
                placeholder="Contoh: Call Center Posko 24 Jam"
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              />
              {fieldErrors.label && <p className="text-[11px] text-[#F87171]">{fieldErrors.label[0]}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="ch-value" className="block font-semibold text-[#D4D4D4]">
                Nilai / Nomor / Alamat <span className="text-[#F87171]">*</span>
              </label>
              <input
                id="ch-value"
                type="text"
                maxLength={255}
                value={formState.value}
                onChange={(e) => setFormState((s) => ({ ...s, value: e.target.value }))}
                placeholder="Contoh: (021) 555-0199 atau email@instansi.go.id"
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] font-mono"
              />
              {fieldErrors.value && <p className="text-[11px] text-[#F87171]">{fieldErrors.value[0]}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="ch-hours" className="block font-semibold text-[#D4D4D4]">
                Jam Operasional
              </label>
              <input
                id="ch-hours"
                type="text"
                maxLength={150}
                value={formState.operating_hours}
                onChange={(e) => setFormState((s) => ({ ...s, operating_hours: e.target.value }))}
                placeholder="Contoh: 24 Jam / Senin–Jumat 08.00–16.00"
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              />
              {fieldErrors.operating_hours && (
                <p className="text-[11px] text-[#F87171]">{fieldErrors.operating_hours[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="ch-sort" className="block font-semibold text-[#D4D4D4]">
                Urutan Tampil (Sort Order)
              </label>
              <input
                id="ch-sort"
                type="number"
                value={formState.sort_order}
                onChange={(e) => setFormState((s) => ({ ...s, sort_order: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] font-mono"
              />
              {fieldErrors.sort_order && (
                <p className="text-[11px] text-[#F87171]">{fieldErrors.sort_order[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="ch-source-name" className="block font-semibold text-[#D4D4D4]">
                Nama Sumber Resmi <span className="text-[#F87171]">*</span>
              </label>
              <input
                id="ch-source-name"
                type="text"
                maxLength={150}
                value={formState.source_name}
                onChange={(e) => setFormState((s) => ({ ...s, source_name: e.target.value }))}
                placeholder="Contoh: Portal Resmi BNPB"
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              />
              {fieldErrors.source_name && (
                <p className="text-[11px] text-[#F87171]">{fieldErrors.source_name[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="ch-source-url" className="block font-semibold text-[#D4D4D4]">
                URL Sumber Resmi <span className="text-[#F87171]">*</span>
              </label>
              <input
                id="ch-source-url"
                type="url"
                maxLength={500}
                value={formState.source_url}
                onChange={(e) => setFormState((s) => ({ ...s, source_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] font-mono"
              />
              {fieldErrors.source_url && (
                <p className="text-[11px] text-[#F87171]">{fieldErrors.source_url[0]}</p>
              )}
            </div>

            {editingChannel === null && (
              <div className="sm:col-span-2 space-y-1">
                <label htmlFor="ch-notes" className="block font-semibold text-[#D4D4D4]">
                  Catatan Awal (Opsional)
                </label>
                <textarea
                  id="ch-notes"
                  rows={2}
                  value={formState.verification_notes}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, verification_notes: e.target.value }))
                  }
                  placeholder="Catatan tambahan terkait sumber atau cakupan kanal..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-[#D4D4D4] cursor-pointer">
              <input
                type="checkbox"
                checked={formState.is_toll_free}
                onChange={(e) => setFormState((s) => ({ ...s, is_toll_free: e.target.checked }))}
                className="rounded border-[#383838]"
              />
              <span>Bebas Pulsa (Toll-Free)</span>
            </label>

            {editingChannel === null && (
              <>
                <label className="inline-flex items-center gap-2 text-[#D4D4D4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_active}
                    onChange={(e) => setFormState((s) => ({ ...s, is_active: e.target.checked }))}
                    className="rounded border-[#383838]"
                  />
                  <span>Aktifkan channel</span>
                </label>
                <label className="inline-flex items-center gap-2 text-[#D4D4D4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_primary}
                    onChange={(e) => setFormState((s) => ({ ...s, is_primary: e.target.checked }))}
                    className="rounded border-[#383838]"
                  />
                  <span>Jadikan Primary</span>
                </label>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
            <button
              type="button"
              disabled={formSubmitting}
              onClick={() => setFormOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-[#212121] hover:bg-[#2A2A2A] text-[#D4D4D4] font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 rounded-lg bg-[#BE123C] hover:bg-[#9F1239] disabled:opacity-60 text-white font-semibold cursor-pointer"
            >
              {formSubmitting
                ? 'Menyimpan...'
                : editingChannel
                ? 'Simpan Perubahan'
                : 'Tambah Channel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DEDICATED VERIFICATION WORKFLOW MODAL */}
      <Modal
        isOpen={verifyTarget !== null}
        onClose={() => !verifySubmitting && setVerifyTarget(null)}
        title="Verifikasi Channel Komunikasi"
        description={
          verifyTarget ? `${verifyTarget.label} (${verifyTarget.value})` : undefined
        }
        size="md"
        theme="dark"
        closeOnBackdropClick={!verifySubmitting}
      >
        {verifyTarget && (
          <form onSubmit={handleVerifySubmit} className="space-y-3.5 text-xs">
            <div className="p-2.5 rounded-lg bg-[#161616] border border-[#2C2C2C] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#A3A3A3]">
                Status saat ini:{' '}
                <strong className="text-[#F5F5F5]">{verifyTarget.verification_status}</strong>
              </span>
              <span className="text-[#8A8A8A]">
                Terakhir diverifikasi: {formatDateTime(verifyTarget.verified_at)}
              </span>
            </div>

            {verifyError && (
              <div className="p-3 rounded-lg bg-[#2A1215] border border-[#7F1D1D] text-[#FCA5A5] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{verifyError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="ver-status" className="block font-semibold text-[#D4D4D4]">
                Status Verifikasi Baru <span className="text-[#F87171]">*</span>
              </label>
              <select
                id="ver-status"
                value={verifyState.verification_status}
                onChange={(e) =>
                  setVerifyState((s) => ({
                    ...s,
                    verification_status: e.target.value as EmergencyDirectoryVerificationStatus,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              >
                {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {verifyFieldErrors.verification_status && (
                <p className="text-[11px] text-[#F87171]">
                  {verifyFieldErrors.verification_status[0]}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="ver-src-name" className="block font-semibold text-[#D4D4D4]">
                Nama Sumber Bukti <span className="text-[#F87171]">*</span>
              </label>
              <input
                id="ver-src-name"
                type="text"
                maxLength={150}
                value={verifyState.source_name}
                onChange={(e) => setVerifyState((s) => ({ ...s, source_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              />
              {verifyFieldErrors.source_name && (
                <p className="text-[11px] text-[#F87171]">{verifyFieldErrors.source_name[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="ver-src-url" className="block font-semibold text-[#D4D4D4]">
                URL Sumber Bukti <span className="text-[#F87171]">*</span>
              </label>
              <input
                id="ver-src-url"
                type="url"
                maxLength={500}
                value={verifyState.source_url}
                onChange={(e) => setVerifyState((s) => ({ ...s, source_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5] font-mono"
              />
              {verifyFieldErrors.source_url && (
                <p className="text-[11px] text-[#F87171]">{verifyFieldErrors.source_url[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="ver-notes" className="block font-semibold text-[#D4D4D4]">
                Catatan Verifikasi
              </label>
              <textarea
                id="ver-notes"
                rows={2}
                value={verifyState.verification_notes}
                onChange={(e) =>
                  setVerifyState((s) => ({ ...s, verification_notes: e.target.value }))
                }
                placeholder="Ringkasan hasil verifikasi sumber resmi..."
                className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
              />
            </div>

            <label className="flex items-start gap-2 p-2.5 rounded-lg bg-[#161616] border border-[#2C2C2C] text-[#D4D4D4] cursor-pointer">
              <input
                type="checkbox"
                checked={verifyState.confirmed}
                onChange={(e) => setVerifyState((s) => ({ ...s, confirmed: e.target.checked }))}
                className="mt-0.5 rounded border-[#383838]"
              />
              <span>
                Saya mengonfirmasi bahwa bukti sumber di atas valid dan perubahan status verifikasi ini akan dicatat pada audit trail.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
              <button
                type="button"
                disabled={verifySubmitting}
                onClick={() => setVerifyTarget(null)}
                className="px-3.5 py-2 rounded-lg bg-[#212121] hover:bg-[#2A2A2A] text-[#D4D4D4] font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={verifySubmitting}
                className="px-4 py-2 rounded-lg bg-[#BE123C] hover:bg-[#9F1239] disabled:opacity-60 text-white font-semibold cursor-pointer"
              >
                {verifySubmitting ? 'Memproses...' : 'Simpan Status Verifikasi'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* CONFIRMATION DIALOG FOR TOGGLE / PRIMARY / ARCHIVE */}
      <Modal
        isOpen={confirmAction !== null}
        onClose={() => !actionSubmitting && setConfirmAction(null)}
        title={
          confirmAction?.type === 'primary'
            ? 'Tetapkan Saluran Utama (Primary)?'
            : confirmAction?.type === 'archive'
            ? 'Arsipkan & Nonaktifkan Channel?'
            : confirmAction?.channel.is_active
            ? 'Nonaktifkan Channel?'
            : 'Aktifkan Channel?'
        }
        size="sm"
        theme="dark"
        closeOnBackdropClick={!actionSubmitting}
      >
        {confirmAction && (
          <div className="space-y-4 text-xs">
            <p className="text-[#D4D4D4] leading-relaxed">
              {confirmAction.type === 'primary' && (
                <>
                  Channel <strong>{confirmAction.channel.label}</strong> ({confirmAction.channel.value}) akan ditetapkan sebagai saluran utama aktif. Saluran primary sebelumnya akan otomatis diturunkan.
                </>
              )}
              {confirmAction.type === 'toggle' && (
                <>
                  Channel <strong>{confirmAction.channel.label}</strong> ({confirmAction.channel.value}) akan{' '}
                  {confirmAction.channel.is_active ? 'dinonaktifkan' : 'diaktifkan'}.
                  {confirmAction.channel.is_active &&
                    contact.publication_status === 'published' &&
                    ' Jika ini satu-satunya channel aktif terverifikasi, kontak induk akan otomatis dikembalikan ke draft.'}
                </>
              )}
              {confirmAction.type === 'archive' && (
                <>
                  Channel <strong>{confirmAction.channel.label}</strong> ({confirmAction.channel.value}) akan dinonaktifkan dan diarsipkan dengan aman. Rekam histori audit tetap dipertahankan.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={() => setConfirmAction(null)}
                className="px-3.5 py-2 rounded-lg bg-[#212121] hover:bg-[#2A2A2A] text-[#D4D4D4] font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-lg bg-[#BE123C] hover:bg-[#9F1239] disabled:opacity-60 text-white font-semibold cursor-pointer"
              >
                {actionSubmitting ? 'Memproses...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminEmergencyChannelsSection;
