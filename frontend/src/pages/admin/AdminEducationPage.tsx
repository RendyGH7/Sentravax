import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  FileText,
  Save,
} from 'lucide-react';
import { adminService } from '../../services/admin-service';
import { publicService } from '../../services/public-service';
import { SafeMarkdown } from '../../components/shared/SafeMarkdown';
import type {
  EducationContentItem,
  HazardTypeItem,
  AdminEducationPayload,
} from '../../types';

export const AdminEducationPage: React.FC = () => {
  const [articles, setArticles] = useState<EducationContentItem[]>([]);
  const [hazardTypes, setHazardTypes] = useState<HazardTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTab, setFormTab] = useState<'editor' | 'preview'>('editor');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formHazardTypeId, setFormHazardTypeId] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('mitigation');
  const [formContentType, setFormContentType] = useState<string>('guide');
  const [formSummary, setFormSummary] = useState<string>('');
  const [formContentBody, setFormContentBody] = useState<string>('');
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formSortOrder, setFormSortOrder] = useState<number>(0);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<EducationContentItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Preview Drawer/Modal State
  const [previewArticle, setPreviewArticle] = useState<EducationContentItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eduRes, typesRes] = await Promise.all([
        adminService.getEducationList({ per_page: 100 }),
        publicService.getHazardTypes(),
      ]);
      setArticles(eduRes.data || []);
      setHazardTypes(typesRes || []);
    } catch (err) {
      console.error('Failed to load admin education data:', err);
      showToast('Gagal memuat data modul edukasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'all') {
        const isPub = statusFilter === 'published';
        if (item.is_published !== isPub) return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          item.title.toLowerCase().includes(term) ||
          item.summary.toLowerCase().includes(term) ||
          item.slug.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [articles, categoryFilter, statusFilter, searchTerm]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormTitle('');
    setFormHazardTypeId(hazardTypes.length > 0 ? String(hazardTypes[0].id) : '');
    setFormCategory('mitigation');
    setFormContentType('guide');
    setFormSummary('');
    setFormContentBody('## Sebelum Bencana\n- Siapkan perlengkapan darurat.\n\n## Saat Bencana\n- Tetap tenang dan lakukan tindakan penyelamatan.\n\n## Sesudah Bencana\n- Periksa keselamatan anggota keluarga.');
    setFormIsPublished(true);
    setFormSortOrder(articles.length + 1);
    setFormTab('editor');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (article: EducationContentItem) => {
    setIsEditing(true);
    setEditingId(article.id);
    setFormTitle(article.title);
    setFormHazardTypeId(article.hazard_type_id ? String(article.hazard_type_id) : '');
    setFormCategory(article.category);
    setFormContentType(article.content_type || 'guide');
    setFormSummary(article.summary);
    setFormContentBody(article.content_body);
    setFormIsPublished(article.is_published);
    setFormSortOrder(article.sort_order ?? 0);
    setFormTab('editor');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Judul panduan wajib diisi.');
      return;
    }
    if (!formSummary.trim()) {
      setFormError('Ringkasan panduan wajib diisi.');
      return;
    }
    if (!formContentBody.trim()) {
      setFormError('Isi modul panduan (Markdown) wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload: AdminEducationPayload = {
        title: formTitle.trim(),
        hazard_type_id: formHazardTypeId ? Number(formHazardTypeId) : null,
        category: formCategory,
        content_type: formContentType,
        summary: formSummary.trim(),
        content_body: formContentBody,
        is_published: formIsPublished,
        sort_order: formSortOrder,
      };

      if (isEditing && editingId) {
        await adminService.updateEducation(editingId, payload);
        showToast('Modul edukasi mitigasi berhasil diperbarui.');
      } else {
        await adminService.createEducation(payload);
        showToast('Modul edukasi mitigasi baru berhasil ditambahkan.');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to save education article:', err);
      setFormError('Gagal menyimpan konten. Periksa kelengkapan isian.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminService.deleteEducation(deleteTarget.id);
      showToast(`Panduan "${deleteTarget.title}" berhasil dihapus.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete education article:', err);
      showToast('Gagal menghapus konten edukasi.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header with Title and Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Literasi & Panduan Mitigasi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola modul keselamatan multi-hazard publik sebelum, saat, dan sesudah bencana.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Panduan Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul atau ringkasan panduan..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="mitigation">Mitigasi</option>
            <option value="preparedness">Kesiapsiagaan</option>
            <option value="response">Tanggap Darurat</option>
            <option value="recovery">Pemulihan</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="published">Diterbitkan (Live)</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500">Memuat modul edukasi...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Tidak ada modul edukasi yang ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">Urutan</th>
                  <th className="px-4 py-3">Judul Panduan & Slug</th>
                  <th className="px-4 py-3">Bahaya</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-500">
                      {article.sort_order ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {article.title}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                        /{article.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                        {article.hazard_type?.name || 'Umum'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-xs font-medium text-slate-600 dark:text-slate-400">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {article.is_published ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3" />
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <XCircle className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewArticle(article)}
                          title="Pratinjau"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(article)}
                          title="Edit Panduan"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(article)}
                          title="Hapus Panduan"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT FORM MODAL WITH LIVE MARKDOWN PREVIEW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Perbarui Modul Panduan Mitigasi' : 'Tambah Panduan Mitigasi Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Judul Panduan *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Panduan Tanggap Darurat & Mitigasi Gempa Tektonik"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Grid for Hazard Type, Category, Sort Order */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Kategori Bahaya
                    </label>
                    <select
                      value={formHazardTypeId}
                      onChange={(e) => setFormHazardTypeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="">Umum / Lintas Bahaya</option>
                      {hazardTypes.map((ht) => (
                        <option key={ht.id} value={ht.id}>
                          {ht.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Fase Siklus
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="mitigation">Mitigasi (Sebelum Bencana)</option>
                      <option value="preparedness">Kesiapsiagaan (Keluarga)</option>
                      <option value="response">Tanggap Darurat (Saat Bencana)</option>
                      <option value="recovery">Pemulihan (Sesudah Bencana)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      min={0}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ringkasan Singkat *
                  </label>
                  <textarea
                    rows={2}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Deskripsi singkat maksimal 2 kalimat untuk kartu panduan..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Content Body Editor with Preview Tab Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Isi Panduan Lengkap (Markdown) *
                    </label>
                    <div className="inline-flex rounded-md p-0.5 bg-slate-100 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => setFormTab('editor')}
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          formTab === 'editor'
                            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormTab('preview')}
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          formTab === 'preview'
                            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Pratinjau Live
                      </button>
                    </div>
                  </div>

                  {formTab === 'editor' ? (
                    <textarea
                      rows={10}
                      value={formContentBody}
                      onChange={(e) => setFormContentBody(e.target.value)}
                      placeholder="Tulis materi dalam format Markdown (## Judul Bab, - Poin tindakan, > Peringatan)..."
                      className="w-full font-mono px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                  ) : (
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 min-h-[240px] max-h-[350px] overflow-y-auto">
                      <SafeMarkdown content={formContentBody} />
                    </div>
                  )}
                </div>

                {/* Published Toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="formIsPublished"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <label htmlFor="formIsPublished" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Publikasikan Langsung ke Publik (Live Status)
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Panduan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-7 h-7" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Hapus Panduan
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus panduan mitigasi <strong>"{deleteTarget.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                  {previewArticle.hazard_type?.name || 'Umum'}
                </span>
                <span className="text-xs text-slate-500">{previewArticle.category}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {previewArticle.title}
              </h2>
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-xs text-teal-900 dark:text-teal-200">
                {previewArticle.summary}
              </div>
              <SafeMarkdown content={previewArticle.content_body} />
            </div>
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEducationPage;
