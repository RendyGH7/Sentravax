import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../../services/admin-service';
import { getApiErrorMessage } from '../../lib/api-error';
import { Modal } from '../ui/Modal';
import type {
  AdminEmergencyContact,
  EmergencyDirectoryVerificationStatus,
  EmergencyDirectoryPublicationStatus,
} from '../../types/emergency-directory';

const VERIFICATION_OPTIONS: Array<{
  value: EmergencyDirectoryVerificationStatus;
  label: string;
}> = [
  { value: 'verified', label: 'Verified (Terverifikasi)' },
  { value: 'unverified', label: 'Unverified (Belum Diverifikasi)' },
  { value: 'source_unavailable', label: 'Source Unavailable (Sumber Tidak Tersedia)' },
  { value: 'rejected', label: 'Rejected (Ditolak)' },
];

const PUBLICATION_OPTIONS: Array<{
  value: EmergencyDirectoryPublicationStatus;
  label: string;
}> = [
  { value: 'published', label: 'Published (Tayang Publik)' },
  { value: 'draft', label: 'Draft (Disembunyikan)' },
  { value: 'archived', label: 'Archived (Diarsipkan)' },
];

export interface AdminEmergencyGovernanceBarProps {
  contact: AdminEmergencyContact;
  canMutate: boolean;
  onRefreshContact: () => Promise<void>;
}

export const AdminEmergencyGovernanceBar: React.FC<AdminEmergencyGovernanceBarProps> = ({
  contact,
  canMutate,
  onRefreshContact,
}) => {
  const channels = contact.channels ?? [];
  const activeVerifiedChannels = channels.filter(
    (c) => c.is_active && c.verification_status === 'verified'
  );
  const isParentVerified = contact.verification_status === 'verified';
  const meetsLocalPrecheck = isParentVerified && activeVerifiedChannels.length > 0;

  // Verification modal state
  const [verModalOpen, setVerModalOpen] = useState(false);
  const [targetVerStatus, setTargetVerStatus] = useState<EmergencyDirectoryVerificationStatus>(
    contact.verification_status
  );
  const [verConfirmed, setVerConfirmed] = useState(false);
  const [verSubmitting, setVerSubmitting] = useState(false);
  const [verError, setVerError] = useState<string | null>(null);

  // Publication modal state
  const [pubModalOpen, setPubModalOpen] = useState(false);
  const [targetPubStatus, setTargetPubStatus] = useState<EmergencyDirectoryPublicationStatus>(
    contact.publication_status
  );
  const [pubSubmitting, setPubSubmitting] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);

  const openVerModal = () => {
    setTargetVerStatus(contact.verification_status);
    setVerConfirmed(false);
    setVerError(null);
    setVerModalOpen(true);
  };

  const openPubModal = (preset?: EmergencyDirectoryPublicationStatus) => {
    setTargetPubStatus(preset ?? contact.publication_status);
    setPubError(null);
    setPubModalOpen(true);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verSubmitting) return;

    if (!verConfirmed) {
      setVerError('Centang konfirmasi pemeriksaan sebelum mengubah status verifikasi kontak.');
      return;
    }

    setVerSubmitting(true);
    setVerError(null);

    try {
      const res = await adminService.updateEmergencyContactVerification(
        contact.id,
        targetVerStatus
      );
      toast.success(res.message);
      setVerModalOpen(false);
      await onRefreshContact();
    } catch (err: unknown) {
      setVerError(getApiErrorMessage(err, 'Gagal memperbarui status verifikasi kontak.'));
    } finally {
      setVerSubmitting(false);
    }
  };

  const handlePublicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pubSubmitting) return;

    setPubSubmitting(true);
    setPubError(null);

    try {
      const res = await adminService.updateEmergencyContactPublication(
        contact.id,
        targetPubStatus
      );
      toast.success(res.message);
      setPubModalOpen(false);
      await onRefreshContact();
    } catch (err: unknown) {
      setPubError(getApiErrorMessage(err, 'Gagal memperbarui status publikasi kontak.'));
    } finally {
      setPubSubmitting(false);
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-[#141414] border border-[#2C2C2C] space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-[#F5F5F5] uppercase tracking-wider text-[11px]">
          Tata Kelola Verifikasi &amp; Publikasi
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
            meetsLocalPrecheck
              ? 'bg-[#064E3B]/50 text-[#34D399] border-[#065F46]'
              : 'bg-[#2E2208] text-[#FBBF24] border-[#78350F]'
          }`}
        >
          {meetsLocalPrecheck ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Prasyarat Publikasi Terpenuhi (Menunggu Keputusan Server)
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3" />
              Belum Memenuhi Syarat Publikasi
            </>
          )}
        </span>
      </div>

      {/* Publication Eligibility Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1A1A1A] border border-[#262626]">
          {isParentVerified ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
          )}
          <span className="text-[#D4D4D4]">
            Status Induk: <strong>{contact.verification_status}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1A1A1A] border border-[#262626]">
          {activeVerifiedChannels.length > 0 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
          )}
          <span className="text-[#D4D4D4]">
            Channel Aktif Terverifikasi: <strong>{activeVerifiedChannels.length}</strong> dari{' '}
            {channels.length}
          </span>
        </div>
      </div>

      {canMutate && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={openVerModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#262626] border border-[#343434] text-xs font-semibold text-[#34D399] cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ubah Verifikasi Induk</span>
          </button>

          {contact.publication_status !== 'published' ? (
            <button
              type="button"
              onClick={() => openPubModal('published')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-semibold cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publikasikan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openPubModal('draft')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E2208] hover:bg-[#3F2E0A] border border-[#78350F] text-[#FBBF24] text-xs font-semibold cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Tarik ke Draft (Unpublish)</span>
            </button>
          )}
        </div>
      )}

      {/* PARENT VERIFICATION MODAL */}
      <Modal
        isOpen={verModalOpen}
        onClose={() => !verSubmitting && setVerModalOpen(false)}
        title="Verifikasi Kontak Darurat Induk"
        description={contact.name}
        size="md"
        theme="dark"
        closeOnBackdropClick={!verSubmitting}
      >
        <form onSubmit={handleVerificationSubmit} className="space-y-3.5 text-xs">
          {verError && (
            <div className="p-3 rounded-lg bg-[#2A1215] border border-[#7F1D1D] text-[#FCA5A5] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{verError}</span>
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-[#161616] border border-[#2C2C2C] text-[#A3A3A3] space-y-1">
            <div>
              Status saat ini: <strong className="text-[#F5F5F5]">{contact.verification_status}</strong>
            </div>
            <div>
              Bukti channel terverifikasi: <strong className="text-[#F5F5F5]">{activeVerifiedChannels.length}</strong> channel aktif.
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="parent-ver-status" className="block font-semibold text-[#D4D4D4]">
              Status Verifikasi Baru
            </label>
            <select
              id="parent-ver-status"
              value={targetVerStatus}
              onChange={(e) =>
                setTargetVerStatus(e.target.value as EmergencyDirectoryVerificationStatus)
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
            >
              {VERIFICATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {contact.publication_status === 'published' && targetVerStatus !== 'verified' && (
            <div className="p-2.5 rounded-lg bg-[#2E2208] border border-[#78350F] text-[#FBBF24]">
              Peringatan: Mencabut verifikasi pada kontak berstatus <strong>published</strong> akan otomatis menurunkannya kembali ke <strong>draft</strong>.
            </div>
          )}

          <label className="flex items-start gap-2 p-2.5 rounded-lg bg-[#161616] border border-[#2C2C2C] text-[#D4D4D4] cursor-pointer">
            <input
              type="checkbox"
              checked={verConfirmed}
              onChange={(e) => setVerConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-[#383838]"
            />
            <span>
              Saya mengonfirmasi perubahan status verifikasi kontak induk ini dan memahami bahwa tindakan akan dicatat di audit trail.
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
            <button
              type="button"
              disabled={verSubmitting}
              onClick={() => setVerModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-[#212121] hover:bg-[#2A2A2A] text-[#D4D4D4] font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={verSubmitting}
              className="px-4 py-2 rounded-lg bg-[#BE123C] hover:bg-[#9F1239] disabled:opacity-60 text-white font-semibold cursor-pointer"
            >
              {verSubmitting ? 'Menyimpan...' : 'Simpan Verifikasi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PARENT PUBLICATION MODAL */}
      <Modal
        isOpen={pubModalOpen}
        onClose={() => !pubSubmitting && setPubModalOpen(false)}
        title="Kelola Status Publikasi Kontak"
        description={contact.name}
        size="md"
        theme="dark"
        closeOnBackdropClick={!pubSubmitting}
      >
        <form onSubmit={handlePublicationSubmit} className="space-y-3.5 text-xs">
          {pubError && (
            <div className="p-3 rounded-lg bg-[#2A1215] border border-[#7F1D1D] text-[#FCA5A5] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{pubError}</span>
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-[#161616] border border-[#2C2C2C] text-[#A3A3A3] space-y-1">
            <div>Syarat Publikasi Backend:</div>
            <div>1. Status verifikasi induk harus <strong>verified</strong> ({isParentVerified ? 'Terpenuhi' : 'Belum'})</div>
            <div>2. Minimal 1 channel aktif berstatus <strong>verified</strong> ({activeVerifiedChannels.length > 0 ? 'Terpenuhi' : 'Belum'})</div>
          </div>

          <div className="space-y-1">
            <label htmlFor="parent-pub-status" className="block font-semibold text-[#D4D4D4]">
              Status Publikasi Target
            </label>
            <select
              id="parent-pub-status"
              value={targetPubStatus}
              onChange={(e) =>
                setTargetPubStatus(e.target.value as EmergencyDirectoryPublicationStatus)
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#2C2C2C] text-[#F5F5F5]"
            >
              {PUBLICATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
            <button
              type="button"
              disabled={pubSubmitting}
              onClick={() => setPubModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-[#212121] hover:bg-[#2A2A2A] text-[#D4D4D4] font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pubSubmitting}
              className="px-4 py-2 rounded-lg bg-[#BE123C] hover:bg-[#9F1239] disabled:opacity-60 text-white font-semibold cursor-pointer"
            >
              {pubSubmitting ? 'Memproses...' : 'Konfirmasi Publikasi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminEmergencyGovernanceBar;
