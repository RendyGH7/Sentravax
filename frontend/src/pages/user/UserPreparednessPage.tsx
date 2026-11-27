import React, { useState, useEffect, useCallback, useId } from 'react';
import { userService } from '../../services/user-service';
import type { 
  PreparednessPlanItem, 
  EmergencyContactItem, 
  GoBagChecklistItem,
  UpdatePlanPayload,
  CreateContactPayload,
  SimulationScenarioItem,
  ScenarioAttemptResult
} from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Label, Input, Textarea, FormErrorMessage, Checkbox } from '../../components/ui/FormControls';
import { 
  ShieldCheck, 
  FileText, 
  Phone, 
  PackageCheck, 
  Plus, 
  Trash2, 
  Pencil,
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  MapPin,
  Clock,
  HeartHandshake,
  Gamepad2,
  Award,
  RotateCcw,
  Check,
  XCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../app/context/useAuth';
import { guestPreparednessSyncService } from '../../services/guest-preparedness-sync-service';

export const UserPreparednessPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('plan');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 1. Family Plan State
  const [plan, setPlan] = useState<PreparednessPlanItem | null>(null);
  const [planForm, setPlanForm] = useState<UpdatePlanPayload>({
    title: '',
    primary_meeting_point: '',
    secondary_meeting_point: '',
    evacuation_notes: '',
  });
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({});

  // 2. Emergency Contacts State
  const [contacts, setContacts] = useState<EmergencyContactItem[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState<boolean>(false);
  const [contactToEdit, setContactToEdit] = useState<EmergencyContactItem | null>(null);
  const [contactToDelete, setContactToDelete] = useState<EmergencyContactItem | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState<boolean>(false);
  const [contactForm, setContactForm] = useState<CreateContactPayload>({
    name: '',
    relationship: '',
    phone_number: '',
    is_emergency_priority: true,
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});

  // 3. Go-Bag Checklist State
  const [checklistCategories, setChecklistCategories] = useState<Record<string, GoBagChecklistItem[]>>({});
  const [checklistStats, setChecklistStats] = useState<{
    total_items: number;
    completed_items: number;
    percentage: number;
  }>({
    total_items: 0,
    completed_items: 0,
    percentage: 0,
  });
  const [togglingItems, setTogglingItems] = useState<Record<number, boolean>>({});

  // 4. Interactive Simulation Scenarios State
  const [scenarios, setScenarios] = useState<SimulationScenarioItem[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenarioItem | null>(null);
  const [isLoadingScenarioDetail, setIsLoadingScenarioDetail] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState<boolean>(false);
  const [attemptResult, setAttemptResult] = useState<ScenarioAttemptResult | null>(null);

  const titleId = useId();
  const primaryMeetingId = useId();
  const secondaryMeetingId = useId();
  const notesId = useId();

  // Load All Preparedness Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (guestPreparednessSyncService.hasGuestChecklistItems()) {
        await guestPreparednessSyncService.syncGuestChecklistToServer(user, false);
      }

      const [planRes, checklistRes, scenariosRes] = await Promise.all([
        userService.getFamilyPlan(),
        userService.getChecklist(),
        userService.getScenarios().catch(() => []),
      ]);

      if (planRes?.plan) {
        setPlan(planRes.plan);
        setPlanForm({
          title: planRes.plan.title || 'Rencana Siaga Keluarga',
          primary_meeting_point: planRes.plan.primary_meeting_point || '',
          secondary_meeting_point: planRes.plan.secondary_meeting_point || '',
          evacuation_notes: planRes.plan.evacuation_notes || '',
        });
      }

      setContacts(planRes?.contacts || []);

      if (checklistRes) {
        setChecklistCategories(checklistRes.categories || {});
        setChecklistStats(checklistRes.stats || { total_items: 0, completed_items: 0, percentage: 0 });
      }

      setScenarios(scenariosRes || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data kesiapsiagaan keluarga.';
      setLoadError(msg);
      toast.error('Gagal memuat data kesiapsiagaan.', { description: msg });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Plan Save
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!planForm.title.trim()) {
      errors.title = 'Judul rencana siaga wajib diisi.';
    }

    if (Object.keys(errors).length > 0) {
      setPlanErrors(errors);
      return;
    }

    setPlanErrors({});
    setIsSavingPlan(true);

    try {
      const updated = await userService.updateFamilyPlan({
        title: planForm.title.trim(),
        primary_meeting_point: planForm.primary_meeting_point?.trim() || null,
        secondary_meeting_point: planForm.secondary_meeting_point?.trim() || null,
        evacuation_notes: planForm.evacuation_notes?.trim() || null,
      });

      setPlan(updated);
      toast.success('Rencana siaga keluarga berhasil disimpan!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan rencana siaga.';
      toast.error('Gagal menyimpan rencana.', { description: msg });
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Open Add Contact Modal
  const handleOpenAddContactModal = () => {
    setContactToEdit(null);
    setContactForm({
      name: '',
      relationship: '',
      phone_number: '',
      is_emergency_priority: true,
    });
    setContactErrors({});
    setIsContactModalOpen(true);
  };

  // Open Edit Contact Modal
  const handleOpenEditContactModal = (contact: EmergencyContactItem) => {
    setContactToEdit(contact);
    setContactForm({
      name: contact.name,
      relationship: contact.relationship,
      phone_number: contact.phone_number,
      is_emergency_priority: contact.is_emergency_priority,
    });
    setContactErrors({});
    setIsContactModalOpen(true);
  };

  // Handle Save Contact (Add or Update)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!contactForm.name.trim()) {
      errors.name = 'Nama kontak wajib diisi.';
    }
    if (!contactForm.relationship.trim()) {
      errors.relationship = 'Hubungan/peran kontak wajib diisi.';
    }
    if (!contactForm.phone_number.trim()) {
      errors.phone_number = 'Nomor telepon wajib diisi.';
    } else if (!/^\+?[0-9\s\-()]{6,25}$/.test(contactForm.phone_number.trim())) {
      errors.phone_number = 'Format nomor telepon tidak valid (contoh: 08123456789 atau +6281234567890).';
    }

    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }

    setContactErrors({});
    setIsSubmittingContact(true);

    try {
      if (contactToEdit) {
        const updated = await userService.updateEmergencyContact(contactToEdit.id, {
          name: contactForm.name.trim(),
          relationship: contactForm.relationship.trim(),
          phone_number: contactForm.phone_number.trim(),
          is_emergency_priority: contactForm.is_emergency_priority ?? true,
        });

        setContacts((prev) => prev.map((c) => (c.id === contactToEdit.id ? updated : c)));
        setIsContactModalOpen(false);
        setContactToEdit(null);
        toast.success(`Kontak "${updated.name}" berhasil diperbarui.`);
      } else {
        const newContact = await userService.addEmergencyContact({
          name: contactForm.name.trim(),
          relationship: contactForm.relationship.trim(),
          phone_number: contactForm.phone_number.trim(),
          is_emergency_priority: contactForm.is_emergency_priority ?? true,
        });

        setContacts((prev) => [newContact, ...prev]);
        setIsContactModalOpen(false);
        toast.success(`Kontak darurat "${newContact.name}" berhasil ditambahkan.`);
      }

      setContactForm({
        name: '',
        relationship: '',
        phone_number: '',
        is_emergency_priority: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kontak darurat.';
      toast.error('Gagal menyimpan kontak.', { description: msg });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Handle Delete Contact
  const handleDeleteContact = async () => {
    if (!contactToDelete || isDeletingContact) return;

    setIsDeletingContact(true);
    try {
      await userService.deleteEmergencyContact(contactToDelete.id);
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      toast.success(`Kontak "${contactToDelete.name}" berhasil dihapus.`);
      setContactToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus kontak darurat.';
      toast.error('Gagal menghapus kontak.', { description: msg });
    } finally {
      setIsDeletingContact(false);
    }
  };

  // Handle Toggle Checklist Item
  const handleToggleChecklist = async (itemId: number) => {
    if (togglingItems[itemId]) return; // Rapid interaction prevention

    setTogglingItems((prev) => ({ ...prev, [itemId]: true }));

    // Optimistic UI update
    setChecklistCategories((prev) => {
      const next: Record<string, GoBagChecklistItem[]> = {};
      for (const [cat, items] of Object.entries(prev)) {
        next[cat] = items.map((it) => 
          it.id === itemId ? { ...it, is_completed: !it.is_completed } : it
        );
      }
      return next;
    });

    try {
      const res = await userService.toggleChecklistItem(itemId);
      
      // Sync with server authoritative state
      setChecklistCategories((prev) => {
        const next: Record<string, GoBagChecklistItem[]> = {};
        for (const [cat, items] of Object.entries(prev)) {
          next[cat] = items.map((it) => 
            it.id === itemId ? { ...it, is_completed: res.is_completed } : it
          );
        }
        return next;
      });

      setChecklistStats((prev) => ({
        ...prev,
        completed_items: res.total_completed,
        percentage: res.percentage,
      }));

      toast.success(
        res.is_completed
          ? 'Item ditandai siap dalam tas siaga.'
          : 'Item ditandai belum siap.',
        { duration: 2000 }
      );
    } catch (err: unknown) {
      // Rollback on server error
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status item.';
      toast.error('Gagal memperbarui item.', { description: msg });

      setChecklistCategories((prev) => {
        const next: Record<string, GoBagChecklistItem[]> = {};
        for (const [cat, items] of Object.entries(prev)) {
          next[cat] = items.map((it) => 
            it.id === itemId ? { ...it, is_completed: !it.is_completed } : it
          );
        }
        return next;
      });
    } finally {
      setTogglingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // 4. Scenario Handlers
  const handleStartScenario = async (scenarioId: number) => {
    setIsLoadingScenarioDetail(true);
    setAttemptResult(null);
    setSelectedAnswers({});
    try {
      const detail = await userService.getScenarioDetail(scenarioId);
      setSelectedScenario(detail);
    } catch (err) {
      console.error('Failed to load scenario detail:', err);
      toast.error('Gagal memuat detail skenario simulasi.');
    } finally {
      setIsLoadingScenarioDetail(false);
    }
  };

  const handleSelectAnswer = (questionId: number, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScenario || !selectedScenario.questions) return;

    const unanswered = selectedScenario.questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      toast.error('Harap jawab seluruh pertanyaan simulasi sebelum mengirimkan evaluasi.');
      return;
    }

    setIsSubmittingAttempt(true);
    try {
      const result = await userService.submitScenarioAttempt(selectedScenario.id, selectedAnswers);
      setAttemptResult(result);
      if (result.passed) {
        toast.success(`Selamat! Anda lulus simulasi dengan skor ${result.score_percentage}%.`);
      } else {
        toast.warning(`Skor Anda ${result.score_percentage}%. Pelajari rekomendasi keselamatan dan coba lagi.`);
      }
    } catch (err: any) {
      console.error('Failed to submit attempt:', err);
      toast.error(err.response?.data?.message || 'Gagal mengevaluasi jawaban simulasi.');
    } finally {
      setIsSubmittingAttempt(false);
    }
  };

  const handleRetakeScenario = () => {
    setSelectedAnswers({});
    setAttemptResult(null);
  };

  const handleBackToScenariosList = () => {
    setSelectedScenario(null);
    setAttemptResult(null);
    setSelectedAnswers({});
  };

  const categoryLabels: Record<string, string> = {
    dokumen: '1. Dokumen & Arsip Penting',
    medis: '2. Medis & Pertolongan Pertama (P3K)',
    logistik: '3. Logistik & Ransum Darurat',
    peralatan: '4. Peralatan & Alat Bertahan Hidup',
    proteksi: '5. Proteksi Diri & Higienitas',
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#111827]">Gagal Memuat Kesiapsiagaan</h3>
        <p className="text-sm text-[#4B5563] max-w-md mx-auto">{loadError}</p>
        <Button onClick={loadData} variant="primary" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] animate-pulse"></span>
            <span className="text-xs font-mono uppercase text-[#BE123C] font-bold">
              Kesiapsiagaan Mandiri Terintegrasi
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
            Kesiapsiagaan & Rencana Darurat Keluarga
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563]">
            Susun titik kumpul evakuasi keluarga, simpan kontak prioritas darurat, dan pantau kelengkapan Tas Siaga Bencana (Go-Bag) Anda.
          </p>
        </div>

        <Button
          onClick={loadData}
          variant="outline"
          size="sm"
          className="gap-2 self-start md:self-auto shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sinkronkan Data
        </Button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Go-Bag Progress */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Kesiapan Tas Siaga</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#BE123C] flex items-center justify-center font-bold">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#111827]">
              {checklistStats.percentage}%
            </span>
            <span className="text-xs text-[#6B7280]">
              ({checklistStats.completed_items}/{checklistStats.total_items} item siap)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#BE123C] h-full transition-all duration-300"
              style={{ width: `${checklistStats.percentage}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Emergency Contacts */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Kontak Darurat Keluarga</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#BE123C] flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111827]">
            {contacts.length}
          </div>
          <p className="text-xs text-[#BE123C] flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan aman di basis data akun
          </p>
        </div>

        {/* Metric 3: Family Plan Status */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Status Rencana Siaga</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#BE123C] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-[#111827] truncate">
            {plan?.primary_meeting_point ? 'Titik Kumpul Ditetapkan' : 'Belum Ditentukan'}
          </div>
          <p className="text-xs text-[#6B7280]">
            {plan?.secondary_meeting_point ? 'Titik alternatif telah siap' : 'Disarankan menambah titik kumpul alternatif'}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={[
          { 
            id: 'plan', 
            label: 'Rencana Siaga Keluarga', 
            icon: <FileText className="w-4 h-4" /> 
          },
          { 
            id: 'contacts', 
            label: 'Kontak Darurat Keluarga', 
            badge: contacts.length, 
            icon: <Phone className="w-4 h-4" /> 
          },
          { 
            id: 'checklist', 
            label: 'Tas Siaga Bencana (Go-Bag)', 
            badge: `${checklistStats.percentage}%`, 
            icon: <PackageCheck className="w-4 h-4" /> 
          },
          { 
            id: 'simulation', 
            label: 'Simulasi Respon Bencana', 
            badge: scenarios.length > 0 ? `${scenarios.length} Skenario` : undefined, 
            icon: <Gamepad2 className="w-4 h-4" /> 
          },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
        variant="pills"
        className="mb-4"
      />

      {/* ========================================================================= */}
      {/* TAB 1: RENCANA SIAGA KELUARGA */}
      {/* ========================================================================= */}
      {activeTab === 'plan' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                Konfigurasi Rencana Siaga Keluarga
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Tentukan kesepakatan titik berkumpul keluarga saat jaringan komunikasi seluler terputus.
              </p>
            </div>
            {plan?.updated_at && (
              <span className="text-[11px] text-[#6B7280] flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" /> Terakhir disimpan: {new Date(plan.updated_at).toLocaleDateString('id-ID')}
              </span>
            )}
          </div>

          {/* Life-Safety Advisory Alert */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Penjelasan Keselamatan Penting:</span>
              <p className="leading-relaxed">
                Titik kumpul keluarga yang Anda catat di bawah merupakan kesepakatan internal keluarga Anda (misalnya taman terdekat atau balai warga), <strong>bukan tempat penampungan pengungsian resmi</strong> yang ditetapkan otoritas. Saat terjadi bencana besar, selalu utamakan instruksi evakuasi resmi dari BPBD dan aparat setempat.
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePlan} className="space-y-4">
            <div>
              <Label htmlFor={titleId} required>Judul Rencana Siaga</Label>
              <Input
                id={titleId}
                type="text"
                value={planForm.title}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Contoh: Rencana Siaga Keluarga Mandiri"
                maxLength={150}
                required
              />
              <FormErrorMessage error={planErrors.title} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={primaryMeetingId}>
                  Titik Kumpul Utama (Primer)
                </Label>
                <div className="relative">
                  <Input
                    id={primaryMeetingId}
                    type="text"
                    value={planForm.primary_meeting_point || ''}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, primary_meeting_point: e.target.value }))}
                    placeholder="Contoh: Halaman Masjid Al-Ikhlas / Balai RW 04"
                    maxLength={255}
                  />
                  <MapPin className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Lokasi terbuka pertama yang dituju seluruh anggota keluarga setelah guncangan/bahaya reda.
                </p>
              </div>

              <div>
                <Label htmlFor={secondaryMeetingId}>
                  Titik Kumpul Alternatif (Sekunder)
                </Label>
                <div className="relative">
                  <Input
                    id={secondaryMeetingId}
                    type="text"
                    value={planForm.secondary_meeting_point || ''}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, secondary_meeting_point: e.target.value }))}
                    placeholder="Contoh: Lapangan Sepak Bola Kelurahan / Rumah Nenek"
                    maxLength={255}
                  />
                  <MapPin className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Lokasi alternatif apabila titik kumpul utama terhalang puing, banjir, atau bahaya sekunder.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor={notesId}>Catatan Khusus Evakuasi & Medis Keluarga</Label>
              <Textarea
                id={notesId}
                rows={4}
                value={planForm.evacuation_notes || ''}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, evacuation_notes: e.target.value }))}
                placeholder="Catat kebutuhan lansia, balita, hewan peliharaan, daftar obat resep rutin, atau lokasi kunci pengaman gas & meteran listrik..."
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Catatan ini disimpan secara terenkripsi dan hanya dapat diakses melalui akun Anda.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingPlan}
                className="gap-2 min-w-[140px]"
              >
                {isSavingPlan ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Rencana
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KONTAK DARURAT KELUARGA */}
      {/* ========================================================================= */}
      {activeTab === 'contacts' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                Daftar Kontak Prioritas Darurat
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Simpan nomor kerabat terdekat, pengurus RT/RW, atau posko lokal untuk komunikasi darurat cepat.
              </p>
            </div>
            <Button
              onClick={handleOpenAddContactModal}
              variant="primary"
              size="sm"
              className="gap-1.5 self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Kontak
            </Button>
          </div>

          {contacts.length === 0 ? (
            <EmptyState
              title="Belum Ada Kontak Darurat"
              description="Tambahkan kontak keluarga atau kerabat di luar kota agar mudah dihubungi saat situasi darurat."
              icon={<Phone className="w-8 h-8 text-[#9CA3AF]" />}
              action={{
                label: 'Tambah Kontak Pertama',
                onClick: handleOpenAddContactModal,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#FECDD3] transition-all flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#111827] truncate">
                        {contact.name}
                      </h4>
                      {contact.is_emergency_priority && (
                        <Badge variant="success" size="sm">
                          Prioritas
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#BE123C] font-medium flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                      {contact.relationship}
                    </p>
                    <a
                      href={`tel:${contact.phone_number}`}
                      className="text-xs font-mono font-semibold text-[#1F2937] hover:text-[#BE123C] inline-flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-[#6B7280]" />
                      {contact.phone_number}
                    </a>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      onClick={() => handleOpenEditContactModal(contact)}
                      variant="ghost"
                      size="sm"
                      className="text-[#BE123C] hover:bg-rose-50 p-2"
                      aria-label={`Ubah kontak ${contact.name}`}
                      title="Ubah Kontak"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setContactToDelete(contact)}
                      variant="ghost"
                      size="sm"
                      className="text-[#DC2626] hover:bg-red-50 p-2"
                      aria-label={`Hapus kontak ${contact.name}`}
                      title="Hapus Kontak"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TAS SIAGA BENCANA (GO-BAG CHECKLIST) */}
      {/* ========================================================================= */}
      {activeTab === 'checklist' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                Tas Siaga Bencana (Go-Bag) — Standar BNPB
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Centang barang yang sudah siap di dalam tas siaga keluarga Anda. Data tersimpan permanen di akun Anda.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold text-[#6B7280]">Status Kesiapsiagaan:</span>
              <Badge 
                variant={checklistStats.percentage >= 80 ? 'success' : checklistStats.percentage >= 40 ? 'warning' : 'danger'}
              >
                {checklistStats.percentage >= 80 ? 'Sangat Siap' : checklistStats.percentage >= 40 ? 'Cukup Siap' : 'Perlu Dilengkapi'}
              </Badge>
            </div>
          </div>

          {/* Checklist Categories List */}
          <div className="space-y-6">
            {Object.entries(checklistCategories).map(([categoryKey, items]) => {
              const categoryTitle = categoryLabels[categoryKey] || categoryKey.toUpperCase();
              const catCompleted = items.filter((i) => i.is_completed).length;

              return (
                <div key={categoryKey} className="space-y-3">
                  <div className="flex items-center justify-between bg-[#F9FAFB] p-2.5 rounded-lg border border-[#E5E7EB]">
                    <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wide">
                      {categoryTitle}
                    </h3>
                    <span className="text-[11px] font-mono text-[#BE123C] font-bold">
                      {catCompleted}/{items.length} Siap
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {items.map((item) => {
                      const isToggling = !!togglingItems[item.id];
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 select-none ${
                            item.is_completed
                              ? 'bg-[#FFF1F2]/70 border-[#FECDD3]'
                              : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                          }`}
                        >
                          <div className="pt-0.5">
                            <Checkbox
                              checked={!!item.is_completed}
                              disabled={isToggling}
                              onChange={() => handleToggleChecklist(item.id)}
                              label={<span className="sr-only">{item.name}</span>}
                              aria-label={`Tandai ${item.name}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isToggling && handleToggleChecklist(item.id)}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-bold ${item.is_completed ? 'line-through text-[#9F1239]' : 'text-[#111827]'}`}>
                                {item.name}
                              </span>
                              {item.is_essential && (
                                <Badge variant="warning" size="sm" className="text-[10px] py-0 px-1">
                                  Penting
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {isToggling && (
                            <RefreshCw className="w-3.5 h-3.5 text-[#BE123C] animate-spin shrink-0 mt-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SIMULASI RESPON BENCANA INTERAKTIF */}
      {/* ========================================================================= */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          {isLoadingScenarioDetail ? (
            <Card className="p-8 space-y-4">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96 max-w-full" />
              <div className="space-y-3 pt-4">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            </Card>
          ) : selectedScenario && attemptResult ? (
            /* HASIL EVALUASI SIMULASI */
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={attemptResult.passed ? 'success' : 'warning'}
                      className="text-xs font-bold"
                    >
                      {attemptResult.passed ? 'LULUS EVALUASI KESELAMATAN' : 'PERLU LATIHAN ULANG'}
                    </Badge>
                    <span className="text-xs text-[#6B7280]">
                      Skor: {attemptResult.earned_score} / {attemptResult.total_possible_score} Poin
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#111827]">
                    Hasil Simulasi: {attemptResult.scenario_title}
                  </h2>
                </div>

                <div className="text-right sm:border-l sm:border-[#E5E7EB] sm:pl-6">
                  <div className="text-3xl font-black text-[#BE123C]">
                    {attemptResult.score_percentage}%
                  </div>
                  <span className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">
                    Akurasi Respon
                  </span>
                </div>
              </div>

              {/* Rincian Jawaban & Penjelasan Edukasi */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                  Evaluasi Butir Keputusan Kritis
                </h3>

                {attemptResult.evaluation_summary.map((item, idx) => (
                  <div
                    key={item.question_id || idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      item.is_correct
                        ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                        : 'bg-[#FEF2F2] border-[#FECACA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                          Pertanyaan {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-[#111827] leading-snug">
                          {item.question}
                        </h4>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                          item.is_correct
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : 'bg-[#FEE2E2] text-[#B91C1C]'
                        }`}
                      >
                        {item.is_correct ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Tepat (+10)
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Kurang Tepat
                          </>
                        )}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-black/5 text-xs space-y-1.5">
                      <p className="text-[#374151]">
                        <strong className="text-[#111827]">Rasional Keselamatan Resmi:</strong>{' '}
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <Button
                  onClick={handleRetakeScenario}
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Ulangi Simulasi Ini
                </Button>
                <Button
                  onClick={handleBackToScenariosList}
                  variant="primary"
                  className="gap-2 w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Pilih Skenario Lain
                </Button>
              </div>
            </Card>
          ) : selectedScenario ? (
            /* SOAL SIMULASI AKTIF */
            <form onSubmit={handleSubmitAttempt} className="space-y-6">
              <Card className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="neutral" className="capitalize text-xs font-bold">
                        Tingkat: {selectedScenario.difficulty}
                      </Badge>
                      <span className="text-xs text-[#6B7280] flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> Est. {selectedScenario.estimated_minutes} Menit
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-[#111827]">
                      {selectedScenario.title}
                    </h2>
                  </div>

                  <Button
                    type="button"
                    onClick={handleBackToScenariosList}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Daftar Skenario
                  </Button>
                </div>

                {/* Skenario Context Brief */}
                <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#15803D] uppercase tracking-wider text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Situasi Tanggap Darurat
                  </div>
                  <p className="text-[#166534] leading-relaxed">
                    {selectedScenario.context_brief}
                  </p>
                </div>

                {/* Pertanyaan */}
                <div className="space-y-6 pt-2">
                  {selectedScenario.questions?.map((q, qIndex) => (
                    <div key={q.id} className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xs sm:text-sm font-bold text-[#111827] leading-snug">
                          <span className="text-[#BE123C] mr-1">Pertanyaan {qIndex + 1}:</span> {q.question}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#D1D5DB] text-[#4B5563] shrink-0">
                          {q.points} Poin
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {q.options.map((opt) => {
                          const isSelected = selectedAnswers[q.id] === opt.id;
                          return (
                            <label
                              key={opt.id}
                              onClick={() => handleSelectAnswer(q.id, opt.id)}
                              className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[#FFF1F2] border-[#BE123C] text-[#9F1239] font-semibold ring-1 ring-[#BE123C]'
                                  : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-neutral-50 hover:border-[#D1D5DB]'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'border-[#BE123C] bg-[#BE123C] text-white'
                                  : 'border-[#D1D5DB] bg-white text-[#6B7280]'
                              }`}>
                                {opt.id}
                              </div>
                              <span className="flex-1 leading-relaxed">{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  <span className="text-xs text-[#6B7280]">
                    Jawab seluruh butir di atas untuk menguji ketahanan refleks darurat Anda.
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmittingAttempt}
                    className="gap-2"
                  >
                    {isSubmittingAttempt ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mengevaluasi...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        Kirim Jawaban & Evaluasi
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </form>
          ) : (
            /* DAFTAR SKENARIO */
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono uppercase text-[#BE123C] font-bold">
                      Uji Kesiapsiagaan Refleks Mandiri
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#111827]">
                    Katalog Skenario Simulasi Bencana
                  </h2>
                  <p className="text-xs text-[#4B5563] mt-1">
                    Pilih skenario darurat untuk melatih keputusan cepat dalam melindungi diri dan keluarga saat bahaya terjadi.
                  </p>
                </div>
              </div>

              {scenarios.length === 0 ? (
                <EmptyState
                  title="Belum Ada Skenario Aktif"
                  description="Modul simulasi tanggap darurat sedang dipersiapkan oleh analis kebencanaan."
                  icon={<Gamepad2 className="w-8 h-8 text-[#9CA3AF]" />}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scenarios.map((sc) => (
                    <Card key={sc.id} className="p-6 flex flex-col justify-between hover:border-[#BE123C] transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant={
                              sc.difficulty === 'pemula'
                                ? 'success'
                                : sc.difficulty === 'menengah'
                                ? 'warning'
                                : 'danger'
                            }
                            className="capitalize text-[11px] font-bold"
                          >
                            Tingkat: {sc.difficulty}
                          </Badge>
                          <span className="text-xs text-[#6B7280] flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5" /> {sc.estimated_minutes} Menit
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-[#111827] line-clamp-1">
                            {sc.title}
                          </h3>
                          <p className="text-xs text-[#4B5563] mt-1.5 line-clamp-2 leading-relaxed">
                            {sc.description}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] text-[#4B5563]">
                          <span className="font-bold text-[#111827] block mb-0.5">Konteks Darurat:</span>
                          <span className="line-clamp-2 leading-relaxed">{sc.context_brief}</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#BE123C]">
                          Tersedia Soal Pilihan Berganda
                        </span>
                        <Button
                          onClick={() => handleStartScenario(sc.id)}
                          variant="primary"
                          size="sm"
                          className="gap-1.5"
                        >
                          <span>Mulai Latihan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / UBAH KONTAK DARURAT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => !isSubmittingContact && setIsContactModalOpen(false)}
        title={contactToEdit ? 'Ubah Informasi Kontak Darurat' : 'Tambah Kontak Darurat Baru'}
        description={
          contactToEdit
            ? 'Perbarui informasi kontak, nomor telepon, atau status prioritas darurat.'
            : 'Pastikan nomor dapat dihubungi dan pemilik nomor mengetahui perannya dalam kondisi darurat.'
        }
      >
        <form onSubmit={handleSaveContact} className="space-y-4">
          <div>
            <Label required>Nama Lengkap / Instansi</Label>
            <Input
              type="text"
              value={contactForm.name}
              onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Budi Santoso / Pak RT 05"
              maxLength={100}
              required
            />
            <FormErrorMessage error={contactErrors.name} />
          </div>

          <div>
            <Label required>Hubungan / Peran</Label>
            <Input
              type="text"
              value={contactForm.relationship}
              onChange={(e) => setContactForm((prev) => ({ ...prev, relationship: e.target.value }))}
              placeholder="Contoh: Saudara Kandung / Posko RW / Puskesmas"
              maxLength={50}
              required
            />
            <FormErrorMessage error={contactErrors.relationship} />
          </div>

          <div>
            <Label required>Nomor Telepon / WhatsApp</Label>
            <Input
              type="tel"
              value={contactForm.phone_number}
              onChange={(e) => setContactForm((prev) => ({ ...prev, phone_number: e.target.value }))}
              placeholder="Contoh: 081234567890 atau +6281234567890"
              maxLength={30}
              required
            />
            <FormErrorMessage error={contactErrors.phone_number} />
          </div>

          <div className="pt-1">
            <Checkbox
              id="emergency-priority-checkbox"
              checked={contactForm.is_emergency_priority}
              onChange={(e) => setContactForm((prev) => ({ ...prev, is_emergency_priority: e.target.checked }))}
              label="Tandai sebagai Kontak Prioritas Darurat (Tampil paling atas)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmittingContact}
              onClick={() => setIsContactModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingContact}
              className="gap-2"
            >
              {isSubmittingContact ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {contactToEdit ? 'Menyimpan...' : 'Menyimpan...'}
                </>
              ) : (
                contactToEdit ? 'Simpan Perubahan' : 'Simpan Kontak'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS KONTAK */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!contactToDelete}
        onClose={() => !isDeletingContact && setContactToDelete(null)}
        title="Hapus Kontak Darurat"
        description="Apakah Anda yakin ingin menghapus kontak ini dari daftar kontak darurat Anda?"
        size="sm"
      >
        <div className="space-y-4">
          {contactToDelete && (
            <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-[#111827] truncate">{contactToDelete.name}</span>
                {contactToDelete.is_emergency_priority && (
                  <Badge variant="success" size="sm">
                    Prioritas
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#BE123C] font-medium flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                {contactToDelete.relationship}
              </p>
              <div className="text-xs font-mono font-semibold text-[#4B5563] flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#6B7280]" />
                {contactToDelete.phone_number}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingContact}
              onClick={() => setContactToDelete(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isDeletingContact}
              onClick={handleDeleteContact}
              className="gap-2"
            >
              {isDeletingContact ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Hapus Kontak
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
