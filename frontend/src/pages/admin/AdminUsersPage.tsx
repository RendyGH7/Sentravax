import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLatestRequest, isRequestCanceled } from '../../hooks/useLatestRequest';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Radio,
  User as UserIcon,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
} from 'lucide-react';
import { adminService, type AdminUserItem, type CreateUserPayload } from '../../services/admin-service';
import { useAuth } from '../../app/context/useAuth';
import { toast } from 'sonner';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [paginationMeta, setPaginationMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    name: '',
    email: '',
    role: 'user',
    password: '',
  });

  // Edit Role Modal State
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [targetRole, setTargetRole] = useState<'admin' | 'intelligence' | 'user'>('user');
  const [submittingRole, setSubmittingRole] = useState<boolean>(false);

  // Delete User Modal State
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);

  const { beginRequest } = useLatestRequest();

  const loadUsers = useCallback(async () => {
    const req = beginRequest();
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        role: roleFilter === 'all' ? undefined : roleFilter,
        search: searchTerm.trim() || undefined,
        per_page: 50,
      }, req.signal);
      if (!req.isCurrent()) return;
      setUsers(res.items);
      setPaginationMeta(res.meta);
    } catch (err: any) {
      if (!req.isCurrent() || isRequestCanceled(err)) return;
      console.error('Failed to load users:', err);
      toast.error('Gagal memuat daftar pengguna.');
    } finally {
      if (req.isCurrent()) {
        setLoading(false);
      }
    }
  }, [beginRequest, roleFilter, searchTerm]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadUsers();
      }
    });
    return () => {
      active = false;
    };
  }, [loadUsers]);

  // Derived user statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const intelligence = users.filter((u) => u.role === 'intelligence').length;
    const citizens = users.filter((u) => u.role === 'user').length;
    return { total, admins, intelligence, citizens };
  }, [users]);

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error('Nama, email, dan kata sandi wajib diisi.');
      return;
    }
    if (createForm.password.length < 8) {
      toast.error('Kata sandi minimal 8 karakter.');
      return;
    }

    try {
      setSubmittingCreate(true);
      const created = await adminService.createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
        password: createForm.password,
      });
      toast.success(`Pengguna ${created.name} (${created.role}) berhasil didaftarkan.`);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', role: 'user', password: '' });
      loadUsers();
    } catch (err: any) {
      console.error('Failed to create user:', err);
      toast.error(err.response?.data?.message || 'Gagal mendaftarkan pengguna baru.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Handle Update Role
  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSubmittingRole(true);
      await adminService.updateUserRole(editingUser.id, { role: targetRole });
      toast.success(`Peran ${editingUser.name} diperbarui menjadi ${targetRole}.`);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      toast.error(err.response?.data?.message || 'Gagal memperbarui peran pengguna.');
    } finally {
      setSubmittingRole(false);
    }
  };

  // Handle Delete User
  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser?.id) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    try {
      setSubmittingDelete(true);
      await adminService.deleteUser(deletingUser.id);
      toast.success(`Pengguna ${deletingUser.name} berhasil dihapus.`);
      setDeletingUser(null);
      loadUsers();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3" />
            ADMINISTRATOR
          </span>
        );
      case 'intelligence':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Radio className="w-3 h-3" />
            INTELLIGENCE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserIcon className="w-3 h-3" />
            CITIZEN (WARGA)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#047857]" />
            Manajemen Pengguna & Otorisasi Peran
          </h1>
          <p className="text-xs text-[#4B5563] mt-1">
            Kelola akun operasional lintas 3 peran resmi: Administrator Sistem, Analis Intelijen, dan Warga Siaga.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadUsers}
            className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl transition-colors border border-[#E5E7EB]"
            title="Muat ulang data"
            aria-label="Muat ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pengguna Baru
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Total Pengguna</span>
            <Users className="w-4 h-4 text-[#4B5563]" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.total}</p>
          <span className="text-[10px] text-[#9CA3AF]">Terdaftar dalam sistem</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Administrator</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.admins}</p>
          <span className="text-[10px] text-purple-600">Akses penuh sistem</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Analis Intelijen</span>
            <Radio className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.intelligence}</p>
          <span className="text-[10px] text-amber-600">Command & verifikasi</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Warga Siaga</span>
            <UserIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{stats.citizens}</p>
          <span className="text-[10px] text-emerald-600">Portal personal warga</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="role-filter" className="text-xs text-[#6B7280] font-medium whitespace-nowrap">
            Filter Peran:
          </label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs rounded-lg border border-[#D1D5DB] py-1.5 px-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#047857]"
          >
            <option value="all">Semua Peran</option>
            <option value="admin">Administrator (admin)</option>
            <option value="intelligence">Analis Intelijen (intelligence)</option>
            <option value="user">Warga Siaga (user)</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#047857]" />
            <p className="text-xs text-[#6B7280]">Memuat daftar pengguna...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <p className="text-sm font-semibold text-[#111827]">Tidak Ada Pengguna Ditemukan</p>
            <p className="text-xs text-[#6B7280]">Sesuaikan kata kunci pencarian atau filter peran Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Peran (Role)</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4">Tanggal Bergabung</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827] flex items-center gap-2">
                        {u.name}
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-[#047857]">
                            Anda
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-[#9CA3AF]" />
                        {u.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Aktif
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-[#9CA3AF]" />
                        {new Date(u.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setTargetRole(u.role);
                          }}
                          className="p-1.5 rounded-lg text-[#047857] hover:bg-[#ECFDF5] transition-colors"
                          title="Ubah Peran"
                          aria-label={`Ubah peran ${u.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Pengguna"
                            aria-label={`Hapus ${u.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {users.length > 0 && (
          <div className="p-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Menampilkan {users.length} dari {paginationMeta.total} pengguna</span>
            <span>Halaman {paginationMeta.current_page} dari {paginationMeta.last_page}</span>
          </div>
        )}
      </div>

      {/* MODAL 1: Create New User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#047857]" />
                Tambah Pengguna Baru
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Alamat Email *</label>
                <input
                  type="email"
                  required
                  placeholder="budi@sentravax.id"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Peran Akses (Role) *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white focus:ring-2 focus:ring-[#047857] focus:outline-none"
                >
                  <option value="user">Warga Siaga (user) - Portal kesiapsiagaan warga</option>
                  <option value="intelligence">Analis Intelijen (intelligence) - Taktis & verifikasi bencana</option>
                  <option value="admin">Administrator Sistem (admin) - Kendali penuh platform</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Kata Sandi Awal * (Min. 8 Karakter)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#047857] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-[#4B5563] font-semibold hover:bg-[#F3F4F6] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] text-white font-bold hover:bg-[#065F46] transition-colors disabled:opacity-50"
                >
                  {submittingCreate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Daftarkan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User Role */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827]">Ubah Peran Pengguna</h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-[#4B5563]">
                Memperbarui hak akses operasional untuk: <strong className="text-[#111827]">{editingUser.name}</strong> ({editingUser.email}).
              </p>

              <div>
                <label className="block font-semibold text-[#374151] mb-1.5">Pilih Peran Baru:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={targetRole === 'user'}
                      onChange={() => setTargetRole('user')}
                      className="text-[#047857]"
                    />
                    <div>
                      <span className="font-bold text-[#111827] block">Warga Siaga (user)</span>
                      <span className="text-[10px] text-[#6B7280]">Portal kesiapsiagaan & lapor bencana</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="intelligence"
                      checked={targetRole === 'intelligence'}
                      onChange={() => setTargetRole('intelligence')}
                      className="text-[#047857]"
                    />
                    <div>
                      <span className="font-bold text-[#111827] block">Analis Intelijen (intelligence)</span>
                      <span className="text-[10px] text-[#6B7280]">Verifikasi laporan, Risk Engine & CAP alerts</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={targetRole === 'admin'}
                      onChange={() => setTargetRole('admin')}
                      className="text-[#047857]"
                    />
                    <div>
                      <span className="font-bold text-[#111827] block">Administrator Sistem (admin)</span>
                      <span className="text-[10px] text-[#6B7280]">Kendali penuh CMS, pengguna & infrastruktur</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submittingRole}
                onClick={handleRoleSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] text-white text-xs font-bold hover:bg-[#065F46] transition-colors disabled:opacity-50"
              >
                {submittingRole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Delete User */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#111827]">Hapus Akun Pengguna?</h2>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Apakah Anda yakin ingin menghapus pengguna <strong className="text-[#111827]">{deletingUser.name}</strong> ({deletingUser.email})? Tindakan ini akan mencabut seluruh hak akses akun secara permanen.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                onClick={handleDeleteSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {submittingDelete ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Hapus Pengguna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
