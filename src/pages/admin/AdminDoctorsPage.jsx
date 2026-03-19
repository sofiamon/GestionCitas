import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Star, UserCheck, UserX, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import usePagination from '../../hooks/usePagination';

const emptyForm = { nombre: '', especialidadId: '', sedes: [], experiencia: '', rating: '' };

const AdminDoctorsPage = () => {
  const { showToast } = useToast();

  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState(null); // doctor id
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { paginated, currentPage, totalPages, totalItems, hasNext, hasPrev, nextPage, prevPage, goToPage } = usePagination(doctors, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, specs, locs] = await Promise.all([
        api.getAdminDoctors(),
        api.getAdminSpecialties(),
        api.getAdminLocations(),
      ]);
      setDoctors(docs);
      setSpecialties(specs);
      setLocations(locs);
    } catch (e) {
      showToast({ type: 'error', title: 'Error al cargar', message: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormModal(true);
  };

  const openEdit = (doc) => {
    setEditing(doc.id);
    setForm({
      nombre: doc.nombre,
      especialidadId: doc.especialidad_id,
      sedes: doc.sedes || [],
      experiencia: String(doc.experiencia ?? ''),
      rating: String(doc.rating ?? ''),
    });
    setFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.especialidadId) return;
    setSubmitting(true);
    try {
      if (editing) {
        const updated = await api.updateDoctor(editing, {
          nombre: form.nombre,
          especialidadId: form.especialidadId,
          sedes: form.sedes,
          experiencia: Number(form.experiencia) || 0,
          rating: Number(form.rating) || 4.5,
        });
        setDoctors(prev => prev.map(d => d.id === editing ? { ...d, ...updated } : d));
        showToast({ type: 'success', title: 'Médico actualizado', message: updated.nombre });
      } else {
        const newDoc = await api.createDoctor({
          nombre: form.nombre,
          especialidadId: form.especialidadId,
          sedes: form.sedes,
          experiencia: Number(form.experiencia) || 0,
          rating: Number(form.rating) || 4.5,
        });
        setDoctors(prev => [...prev, { ...newDoc, userAccount: null }]);
        showToast({ type: 'success', title: 'Médico creado', message: newDoc.nombre });
      }
      setFormModal(false);
    } catch (e) {
      showToast({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteDoctor(deleteTarget.id);
      setDoctors(prev => prev.filter(d => d.id !== deleteTarget.id));
      showToast({ type: 'success', title: 'Médico eliminado', message: deleteTarget.nombre });
      setDeleteTarget(null);
    } catch (e) {
      showToast({ type: 'error', title: 'No se puede eliminar', message: e.message });
    } finally {
      setDeleting(false);
    }
  };

  const toggleSede = (sedeId) => {
    setForm(f => ({
      ...f,
      sedes: f.sedes.includes(sedeId)
        ? f.sedes.filter(s => s !== sedeId)
        : [...f.sedes, sedeId],
    }));
  };

  const getSpecialtyName = (id) => specialties.find(s => s.id === id)?.nombre || id;
  const getLocationName  = (id) => locations.find(l => l.id === id)?.nombre || id;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Médicos</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Administra el directorio de médicos del sistema</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>Nuevo Médico</Button>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner className="py-16" />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Médico', 'Especialidad', 'Sedes', 'Exp.', 'Rating', 'Cuenta', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No hay médicos registrados
                    </td>
                  </tr>
                ) : paginated.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap">{doc.nombre}</p>
                    </td>

                    {/* Specialty */}
                    <td className="px-4 py-3">
                      <Badge variant="primary">{getSpecialtyName(doc.especialidad_id)}</Badge>
                    </td>

                    {/* Sedes */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(doc.sedes || []).length === 0 ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (doc.sedes).map(s => (
                          <Badge key={s} variant="neutral" className="text-[10px] py-0.5 px-2">{getLocationName(s)}</Badge>
                        ))}
                      </div>
                    </td>

                    {/* Experience */}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {doc.experiencia} años
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="text-gray-700 dark:text-gray-200 font-medium">{doc.rating}</span>
                      </div>
                    </td>

                    {/* User account */}
                    <td className="px-4 py-3">
                      {doc.userAccount ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={14} className="text-green-500 flex-shrink-0" />
                          <span className="text-xs text-green-600 dark:text-green-400 truncate max-w-[140px]">
                            {doc.userAccount.email}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <UserX size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                          <span className="text-xs text-gray-400">Sin cuenta</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEdit(doc)}
                          title="Editar"
                          className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-600 transition-colors cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
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
                {totalItems} médico{totalItems !== 1 ? 's' : ''} · Página {currentPage} de {totalPages}
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

      {/* Create / Edit modal */}
      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title={editing ? 'Editar Médico' : 'Nuevo Médico'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={!form.nombre.trim() || !form.especialidadId}
            >
              {editing ? 'Guardar cambios' : 'Crear Médico'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre completo <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Dr. Nombre Apellido"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {/* Especialidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Especialidad <span className="text-error">*</span>
            </label>
            <select
              value={form.especialidadId}
              onChange={e => setForm(f => ({ ...f, especialidadId: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Seleccionar especialidad...</option>
              {specialties.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          {/* Experiencia + Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Años de experiencia
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={form.experiencia}
                onChange={e => setForm(f => ({ ...f, experiencia: e.target.value }))}
                placeholder="0"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Rating (1.0 – 5.0)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                placeholder="4.5"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Sedes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sedes de atención
            </label>
            {locations.length === 0 ? (
              <p className="text-xs text-gray-400">No hay sedes disponibles</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {locations.map(loc => (
                  <label
                    key={loc.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${
                      form.sedes.includes(loc.id)
                        ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.sedes.includes(loc.id)}
                      onChange={() => toggleSede(loc.id)}
                      className="rounded accent-primary-600 flex-shrink-0"
                    />
                    <span className="truncate">{loc.nombre}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar Médico"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Eliminar
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              ¿Eliminar a <span className="font-semibold">{deleteTarget?.nombre}</span>?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Solo es posible si no tiene citas futuras pendientes o confirmadas. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDoctorsPage;
