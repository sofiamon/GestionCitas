import React, { useState, useEffect, useCallback } from 'react';
import { Search, Power, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';

const ROLE_LABELS   = { paciente: 'Paciente', medico: 'Médico', admin: 'Administrador' };
const ROLE_VARIANTS = { paciente: 'neutral', medico: 'secondary', admin: 'primary' };
const ROLE_AVATAR   = { paciente: 'bg-gray-200 text-gray-600', medico: 'bg-cyan-100 text-cyan-700', admin: 'bg-violet-100 text-violet-700' };

const getInitials = (name) =>
  (name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

const AdminUsersPage = () => {
  const { showToast } = useToast();

  // Data
  const [allUsers, setAllUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activoFilter, setActivoFilter] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Actions
  const [togglingId, setTogglingId] = useState(null);
  const [roleModal, setRoleModal] = useState(null); // { user }
  const [newRole, setNewRole] = useState('');
  const [newMedicoId, setNewMedicoId] = useState('');
  const [changingRole, setChangingRole] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  const loadDoctors = useCallback(async () => {
    try {
      const docs = await api.getAdminDoctors();
      setDoctors(docs);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers(
        roleFilter || undefined,
        debouncedSearch || undefined,
        activoFilter !== '' ? activoFilter : undefined
      );
      setAllUsers(data);
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setLoading(false);
    }
  }, [roleFilter, debouncedSearch, activoFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  const { paginated, currentPage, totalPages, totalItems, hasNext, hasPrev, nextPage, prevPage, goToPage, reset } = usePagination(allUsers, 10);

  // Reset to page 1 on filter change
  useEffect(() => { reset(); }, [roleFilter, debouncedSearch, activoFilter]);

  // Doctors without a linked user account
  const unlinkedDoctors = doctors.filter(d => !d.userAccount);

  const handleToggleActive = async (user) => {
    setTogglingId(user.id);
    try {
      const res = await api.toggleUserActive(user.id);
      setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, activo: res.activo } : u));
      showToast({
        type: 'success',
        title: res.activo ? 'Usuario activado' : 'Usuario desactivado',
        message: user.nombreCompleto,
      });
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setTogglingId(null);
    }
  };

  const openRoleModal = (user) => {
    setRoleModal(user);
    setNewRole(user.role);
    setNewMedicoId('');
    setConfirmStep(false);
  };

  const handleChangeRole = async () => {
    if (!roleModal || !newRole) return;
    if (!confirmStep) { setConfirmStep(true); return; }
    setChangingRole(true);
    try {
      await api.changeUserRole(roleModal.id, newRole, newRole === 'medico' ? newMedicoId : undefined);
      setAllUsers(prev => prev.map(u => u.id === roleModal.id ? { ...u, role: newRole } : u));
      showToast({ type: 'success', title: 'Rol actualizado', message: `${roleModal.nombreCompleto} → ${ROLE_LABELS[newRole]}` });
      setRoleModal(null);
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setChangingRole(false);
    }
  };

  const isMedicoRoleInvalid = newRole === 'medico' && !newMedicoId;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Usuarios</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Administra afiliados, médicos y administradores</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, cédula o email..."
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Todos los roles</option>
            <option value="paciente">Pacientes</option>
            <option value="medico">Médicos</option>
            <option value="admin">Administradores</option>
          </select>
          <select
            value={activoFilter}
            onChange={e => setActivoFilter(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          {!loading && (
            <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
              Mostrando {totalItems} usuario{totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <Spinner className="py-16" />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Usuario', 'Cédula', 'Email', 'Rol', 'Estado', 'Registro', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No se encontraron usuarios con los filtros actuales
                    </td>
                  </tr>
                ) : paginated.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    {/* Avatar + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ROLE_AVATAR[u.role] || ROLE_AVATAR.paciente}`}>
                          {getInitials(u.nombreCompleto)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[160px]">{u.nombreCompleto}</p>
                          {u.celular && <p className="text-xs text-gray-400">{u.celular}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">{u.cedula}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_VARIANTS[u.role] || 'neutral'}>{ROLE_LABELS[u.role] || u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.activo ? 'success' : 'error'} dot>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs tabular-nums whitespace-nowrap">{u.fecha_registro}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={togglingId === u.id}
                          title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${u.activo ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600' : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600'}`}
                        >
                          <Power size={15} />
                        </button>
                        <button
                          onClick={() => openRoleModal(u)}
                          title="Cambiar rol"
                          className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-400 hover:text-violet-600 transition-colors cursor-pointer"
                        >
                          <ShieldAlert size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={prevPage}
                  disabled={!hasPrev}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-600 dark:text-gray-300 cursor-pointer disabled:cursor-default transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - currentPage) <= 2)
                  .map(p => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors cursor-pointer ${p === currentPage ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  onClick={nextPage}
                  disabled={!hasNext}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-600 dark:text-gray-300 cursor-pointer disabled:cursor-default transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Change role modal */}
      <Modal
        isOpen={!!roleModal}
        onClose={() => setRoleModal(null)}
        title="Cambiar Rol de Usuario"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { if (confirmStep) setConfirmStep(false); else setRoleModal(null); }}>
              {confirmStep ? 'Atrás' : 'Cancelar'}
            </Button>
            <Button
              onClick={handleChangeRole}
              loading={changingRole}
              disabled={!newRole || newRole === roleModal?.role || isMedicoRoleInvalid}
            >
              {confirmStep ? 'Confirmar cambio' : 'Cambiar Rol'}
            </Button>
          </>
        }
      >
        {!confirmStep ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ROLE_AVATAR[roleModal?.role] || ROLE_AVATAR.paciente}`}>
                {getInitials(roleModal?.nombreCompleto)}
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{roleModal?.nombreCompleto}</p>
                <p className="text-xs text-gray-400">{roleModal?.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nuevo rol</label>
              <select
                value={newRole}
                onChange={e => { setNewRole(e.target.value); setNewMedicoId(''); }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="paciente">Paciente</option>
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {newRole === 'medico' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Doctor asociado <span className="text-error">*</span>
                </label>
                <select
                  value={newMedicoId}
                  onChange={e => setNewMedicoId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Seleccionar doctor...</option>
                  {unlinkedDoctors.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
                {unlinkedDoctors.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Todos los doctores ya tienen cuenta asociada.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              ¿Confirmas cambiar el rol de <span className="font-semibold">{roleModal?.nombreCompleto}</span>?
            </p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <Badge variant={ROLE_VARIANTS[roleModal?.role] || 'neutral'}>{ROLE_LABELS[roleModal?.role]}</Badge>
              <span className="text-gray-400 text-sm">→</span>
              <Badge variant={ROLE_VARIANTS[newRole] || 'neutral'}>{ROLE_LABELS[newRole]}</Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
