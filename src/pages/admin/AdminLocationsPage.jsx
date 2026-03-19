import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, MapPin, Phone, Clock, Stethoscope, Building, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

const emptyForm = { nombre: '', direccion: '', telefono: '', horario: '', lat: '', lng: '' };

const AdminLocationsPage = () => {
  const { showToast } = useToast();

  const [locations, setLocations] = useState([]);
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
      const [locs, docs] = await Promise.all([
        api.getAdminLocations(),
        api.getAdminDoctors(),
      ]);
      setLocations(locs);
      setDoctors(docs);
    } catch (e) {
      showToast({ type: 'error', title: 'Error al cargar', message: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doctorCountForLocation = (locId) =>
    doctors.filter(d => (d.sedes || []).includes(locId)).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormModal(true);
  };

  const openEdit = (loc) => {
    setEditing(loc.id);
    setForm({
      nombre:    loc.nombre,
      direccion: loc.direccion,
      telefono:  loc.telefono  || '',
      horario:   loc.horario   || '',
      lat:       loc.lat  != null ? String(loc.lat)  : '',
      lng:       loc.lng  != null ? String(loc.lng)  : '',
    });
    setFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.direccion.trim()) return;
    setSubmitting(true);
    const payload = {
      nombre:    form.nombre.trim(),
      direccion: form.direccion.trim(),
      telefono:  form.telefono.trim(),
      horario:   form.horario.trim(),
      lat:       form.lat !== '' ? Number(form.lat) : null,
      lng:       form.lng !== '' ? Number(form.lng) : null,
    };
    try {
      if (editing) {
        const updated = await api.updateLocation(editing, payload);
        setLocations(prev => prev.map(l => l.id === editing ? updated : l));
        showToast({ type: 'success', title: 'Sede actualizada', message: updated.nombre });
      } else {
        const newLoc = await api.createLocation(payload);
        setLocations(prev => [...prev, newLoc]);
        showToast({ type: 'success', title: 'Sede creada', message: newLoc.nombre });
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
      await api.deleteLocation(deleteTarget.id);
      setLocations(prev => prev.filter(l => l.id !== deleteTarget.id));
      showToast({ type: 'success', title: 'Sede eliminada', message: deleteTarget.nombre });
      setDeleteTarget(null);
    } catch (e) {
      showToast({ type: 'error', title: 'No se puede eliminar', message: e.message });
    } finally {
      setDeleting(false);
    }
  };

  const field = (key, label, placeholder, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-error ml-1">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        step={type === 'number' ? 'any' : undefined}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400"
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Sedes</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Administra las sedes de atención médica</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>Nueva Sede</Button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <Spinner className="py-16" />
      ) : locations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <MapPin size={40} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-400 font-medium">No hay sedes registradas</p>
            <p className="text-sm text-gray-400 mt-1">Crea la primera sede con el botón de arriba</p>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map(loc => {
            const docCount = doctorCountForLocation(loc.id);
            return (
              <Card key={loc.id} className="flex flex-col">
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Building size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 leading-tight">{loc.nombre}</h3>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => openEdit(loc)}
                      title="Editar sede"
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-600 transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(loc)}
                      title="Eliminar sede"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>{loc.direccion}</span>
                  </div>
                  {loc.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{loc.telefono}</span>
                    </div>
                  )}
                  {loc.horario && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Clock size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span>{loc.horario}</span>
                    </div>
                  )}
                </div>

                {/* Footer: doctor count */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <Stethoscope size={13} className="text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {docCount} médico{docCount !== 1 ? 's' : ''} asignado{docCount !== 1 ? 's' : ''}
                  </span>
                  {loc.lat != null && loc.lng != null && (
                    <span className="ml-auto text-[10px] text-gray-300 dark:text-gray-600 tabular-nums">
                      {Number(loc.lat).toFixed(4)}, {Number(loc.lng).toFixed(4)}
                    </span>
                  )}
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
        title={editing ? 'Editar Sede' : 'Nueva Sede'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={!form.nombre.trim() || !form.direccion.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear Sede'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {field('nombre',    'Nombre',    'Sede Norte',                         'text',   true)}
          {field('direccion', 'Dirección', 'Calle 100 #15-20, Bogotá',           'text',   true)}
          {field('telefono',  'Teléfono',  '601-123-4567',                        'text')}
          {field('horario',   'Horario',   'Lun-Vie 6:00-20:00, Sab 7:00-14:00', 'text')}
          <div className="grid grid-cols-2 gap-4">
            {field('lat', 'Latitud (opcional)',  '4.6836',   'number')}
            {field('lng', 'Longitud (opcional)', '-74.0479',  'number')}
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar Sede"
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
              ¿Eliminar la sede <span className="font-semibold">{deleteTarget?.nombre}</span>?
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Solo es posible si ningún médico tiene esta sede asignada. Esta acción no se puede deshacer.
            </p>
            {deleteTarget && doctorCountForLocation(deleteTarget.id) > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                ⚠ {doctorCountForLocation(deleteTarget.id)} médico{doctorCountForLocation(deleteTarget.id) !== 1 ? 's tienen' : ' tiene'} esta sede asignada.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLocationsPage;
