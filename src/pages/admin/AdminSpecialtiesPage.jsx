import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Layers, AlertTriangle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

const ICON_OPTIONS = [
  { name: 'Stethoscope', label: 'Estetoscopio' },
  { name: 'Smile',       label: 'Odontología' },
  { name: 'Baby',        label: 'Pediatría' },
  { name: 'Heart',       label: 'Corazón' },
  { name: 'HeartPulse',  label: 'Cardiología' },
  { name: 'Sparkles',    label: 'Dermatología' },
  { name: 'Eye',         label: 'Oftalmología' },
  { name: 'Brain',       label: 'Neurología' },
  { name: 'Bone',        label: 'Ortopedia' },
  { name: 'Ear',         label: 'Otología' },
  { name: 'Syringe',     label: 'Vacunación' },
  { name: 'Microscope',  label: 'Laboratorio' },
];

const emptyForm = { nombre: '', icono: 'Stethoscope', descripcion: '' };

const SpecIcon = ({ name, size = 20, className = '' }) => {
  const Comp = LucideIcons[name];
  return Comp ? <Comp size={size} className={className} /> : <LucideIcons.Stethoscope size={size} className={className} />;
};

const AdminSpecialtiesPage = () => {
  const { showToast } = useToast();

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [specs, docs] = await Promise.all([
        api.getAdminSpecialties(),
        api.getAdminDoctors(),
      ]);
      setSpecialties(specs);
      setDoctors(docs);
    } catch (e) {
      showToast({ type: 'error', title: 'Error al cargar', message: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doctorCount = (specId) => doctors.filter(d => d.especialidad_id === specId).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormModal(true);
  };

  const openEdit = (spec) => {
    setEditing(spec.id);
    setForm({
      nombre:      spec.nombre,
      icono:       spec.icono || 'Stethoscope',
      descripcion: spec.descripcion || '',
    });
    setFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return;
    setSubmitting(true);
    const payload = {
      nombre:      form.nombre.trim(),
      icono:       form.icono,
      descripcion: form.descripcion.trim(),
    };
    try {
      if (editing) {
        const updated = await api.updateSpecialty(editing, payload);
        setSpecialties(prev => prev.map(s => s.id === editing ? updated : s));
        showToast({ type: 'success', title: 'Especialidad actualizada', message: updated.nombre });
      } else {
        const newSpec = await api.createSpecialty(payload);
        setSpecialties(prev => [...prev, newSpec]);
        showToast({ type: 'success', title: 'Especialidad creada', message: newSpec.nombre });
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
      await api.deleteSpecialty(deleteTarget.id);
      setSpecialties(prev => prev.filter(s => s.id !== deleteTarget.id));
      showToast({ type: 'success', title: 'Especialidad eliminada', message: deleteTarget.nombre });
      setDeleteTarget(null);
    } catch (e) {
      showToast({ type: 'error', title: 'No se puede eliminar', message: e.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Especialidades</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Administra las especialidades médicas disponibles</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>Nueva Especialidad</Button>
      </div>

      {/* Grid */}
      {loading ? (
        <Spinner className="py-16" />
      ) : specialties.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Layers size={40} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-400 font-medium">No hay especialidades registradas</p>
            <p className="text-sm text-gray-400 mt-1">Crea la primera con el botón de arriba</p>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {specialties.map(spec => {
            const count = doctorCount(spec.id);
            return (
              <Card key={spec.id} className="flex flex-col">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <SpecIcon name={spec.icono} size={20} className="text-white" />
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(spec)}
                      title="Editar"
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-600 transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(spec)}
                      title="Eliminar"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Name + description */}
                <p className="font-semibold text-gray-800 dark:text-gray-100 leading-tight">{spec.nombre}</p>
                {spec.descripcion ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex-1 line-clamp-2">{spec.descripcion}</p>
                ) : (
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 flex-1 italic">Sin descripción</p>
                )}

                {/* Footer: doctor count */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className={`text-xs font-medium ${count > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {count} médico{count !== 1 ? 's' : ''} asignado{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title={editing ? 'Editar Especialidad' : 'Nueva Especialidad'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={!form.nombre.trim()}>
              {editing ? 'Guardar cambios' : 'Crear Especialidad'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Neurología"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {/* Ícono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ícono</label>
            <div className="grid grid-cols-6 gap-1.5">
              {ICON_OPTIONS.map(({ name, label }) => {
                const isSelected = form.icono === name;
                return (
                  <button
                    key={name}
                    type="button"
                    title={label}
                    onClick={() => setForm(f => ({ ...f, icono: name }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <SpecIcon
                      name={name}
                      size={18}
                      className={isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}
                    />
                    <span className={`text-[9px] leading-tight text-center ${isSelected ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              placeholder="Breve descripción de la especialidad..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar Especialidad"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Eliminar</Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              ¿Eliminar <span className="font-semibold">{deleteTarget?.nombre}</span>?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Solo es posible si ningún médico tiene esta especialidad asignada. Esta acción no se puede deshacer.
            </p>
            {deleteTarget && doctorCount(deleteTarget.id) > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                ⚠ {doctorCount(deleteTarget.id)} médico{doctorCount(deleteTarget.id) !== 1 ? 's tienen' : ' tiene'} esta especialidad asignada.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSpecialtiesPage;
