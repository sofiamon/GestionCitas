const router = require('express').Router();
const { getStore, save } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.use(auth);
router.use(requireRole('admin'));

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

// GET /admin/dashboard
router.get('/dashboard', (req, res, next) => {
  try {
    const store = getStore();
    const today = new Date().toISOString().split('T')[0];

    const pacientes = store.users.filter(u => u.role === 'paciente');
    const medicos   = store.users.filter(u => u.role === 'medico');
    const apts      = store.appointments;

    // Últimos 30 días de registros
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const registrosUltimos30Dias = pacientes.filter(
      u => new Date(u.fecha_registro) >= thirtyDaysAgo
    ).length;

    // Citas por especialidad (top 5)
    const byEspecialidad = {};
    for (const a of apts) {
      const key = a.especialidad_nombre || a.especialidad_id;
      byEspecialidad[key] = (byEspecialidad[key] || 0) + 1;
    }
    const citasPorEspecialidad = Object.entries(byEspecialidad)
      .map(([especialidad, total]) => ({ especialidad, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Citas por mes (últimos 6 meses)
    const meses = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      meses[key] = 0;
    }
    for (const a of apts) {
      const mes = a.fecha.slice(0, 7);
      if (mes in meses) meses[mes]++;
    }
    const citasPorMes = Object.entries(meses).map(([mes, total]) => ({ mes, total }));

    res.json({
      totalUsuarios: pacientes.length,
      totalMedicos: medicos.length,
      totalCitas: apts.length,
      citasHoy: apts.filter(a => a.fecha === today && a.estado !== 'cancelada').length,
      citasCompletadas: apts.filter(a => a.estado === 'completada').length,
      citasCanceladas: apts.filter(a => a.estado === 'cancelada').length,
      totalMedicamentos: store.medications.length,
      renovacionesPendientes: store.renewal_requests.filter(r => r.estado === 'pendiente').length,
      autorizacionesPendientes: store.authorizations.filter(a => a.estado === 'pendiente').length,
      totalSedes: store.locations.length,
      totalEspecialidades: store.specialties.length,
      registrosUltimos30Dias,
      citasPorEspecialidad,
      citasPorMes,
    });
  } catch (err) { next(err); }
});

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

const safeUser = (u) => {
  const { password_hash, reset_code, reset_code_expires, ...safe } = u;
  return safe;
};

// GET /admin/users
router.get('/users', (req, res, next) => {
  try {
    const store = getStore();
    const { role, search, activo } = req.query;

    let users = store.users.map(safeUser);

    if (role) users = users.filter(u => u.role === role);
    if (activo !== undefined) users = users.filter(u => String(u.activo) === activo);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.apellido || '').toLowerCase().includes(q) ||
        (u.cedula || '').includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }

    users.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
    res.json(users);
  } catch (err) { next(err); }
});

// PATCH /admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', (req, res, next) => {
  try {
    const store = getStore();
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });
    }
    const user = store.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    user.activo = !user.activo;
    save();
    res.json({ success: true, activo: user.activo });
  } catch (err) { next(err); }
});

// PATCH /admin/users/:id/change-role
router.patch('/users/:id/change-role', (req, res, next) => {
  try {
    const store = getStore();
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }
    const { role, medicoId } = req.body;
    const VALID_ROLES = ['paciente', 'medico', 'admin'];
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    const user = store.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    user.role = role;
    if (role === 'medico') {
      if (!medicoId) return res.status(400).json({ error: 'medicoId requerido para rol médico' });
      user.medico_id = medicoId;
    } else {
      delete user.medico_id;
    }
    save();
    res.json(safeUser(user));
  } catch (err) { next(err); }
});

// ─── DOCTORES ─────────────────────────────────────────────────────────────────

// GET /admin/doctors
router.get('/doctors', (req, res, next) => {
  try {
    const store = getStore();
    const doctors = store.doctors.map(doc => {
      const userAccount = store.users.find(u => u.medico_id === doc.id) || null;
      return {
        ...doc,
        userAccount: userAccount ? safeUser(userAccount) : null,
      };
    });
    res.json(doctors);
  } catch (err) { next(err); }
});

// POST /admin/doctors
router.post('/doctors', (req, res, next) => {
  try {
    const store = getStore();
    const { nombre, especialidadId, sedes, experiencia, rating } = req.body;
    if (!nombre || !especialidadId) {
      return res.status(400).json({ error: 'nombre y especialidadId son requeridos' });
    }
    const defaultDisponibilidad = {
      lunes:    ['08:00','08:30','09:00','09:30','10:00','10:30','14:00','14:30','15:00'],
      martes:   ['08:00','08:30','09:00','09:30','10:00','14:00','14:30'],
      miercoles:['08:00','08:30','09:00','09:30','10:00','10:30'],
      jueves:   ['14:00','14:30','15:00','15:30','16:00'],
      viernes:  ['08:00','08:30','09:00','09:30','10:00'],
    };
    const newDoc = {
      id: uuidv4(),
      nombre,
      especialidad_id: especialidadId,
      foto: null,
      experiencia: Number(experiencia) || 0,
      rating: Number(rating) || 4.5,
      sedes: sedes || [],
      disponibilidad: defaultDisponibilidad,
    };
    store.doctors.push(newDoc);
    save();
    res.status(201).json(newDoc);
  } catch (err) { next(err); }
});

// PUT /admin/doctors/:id
router.put('/doctors/:id', (req, res, next) => {
  try {
    const store = getStore();
    const doc = store.doctors.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Doctor no encontrado' });
    const { nombre, especialidadId, sedes, experiencia, rating, disponibilidad } = req.body;
    if (nombre !== undefined) doc.nombre = nombre;
    if (especialidadId !== undefined) doc.especialidad_id = especialidadId;
    if (sedes !== undefined) doc.sedes = sedes;
    if (experiencia !== undefined) doc.experiencia = Number(experiencia);
    if (rating !== undefined) doc.rating = Number(rating);
    if (disponibilidad !== undefined) doc.disponibilidad = disponibilidad;
    save();
    res.json(doc);
  } catch (err) { next(err); }
});

// DELETE /admin/doctors/:id
router.delete('/doctors/:id', (req, res, next) => {
  try {
    const store = getStore();
    const doc = store.doctors.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Doctor no encontrado' });
    const today = new Date().toISOString().split('T')[0];
    const hasActive = store.appointments.some(
      a => a.medico_id === req.params.id &&
           a.fecha >= today &&
           (a.estado === 'pendiente' || a.estado === 'confirmada')
    );
    if (hasActive) {
      return res.status(400).json({ error: 'El doctor tiene citas futuras activas. Cancélalas primero.' });
    }
    store.doctors = store.doctors.filter(d => d.id !== req.params.id);
    save();
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── SEDES ────────────────────────────────────────────────────────────────────

// GET /admin/locations
router.get('/locations', (req, res, next) => {
  try {
    res.json(getStore().locations);
  } catch (err) { next(err); }
});

// POST /admin/locations
router.post('/locations', (req, res, next) => {
  try {
    const store = getStore();
    const { nombre, direccion, telefono, horario, lat, lng } = req.body;
    if (!nombre || !direccion) {
      return res.status(400).json({ error: 'nombre y direccion son requeridos' });
    }
    const newLoc = {
      id: uuidv4(),
      nombre,
      direccion,
      telefono: telefono || '',
      horario: horario || '',
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    };
    store.locations.push(newLoc);
    save();
    res.status(201).json(newLoc);
  } catch (err) { next(err); }
});

// PUT /admin/locations/:id
router.put('/locations/:id', (req, res, next) => {
  try {
    const store = getStore();
    const loc = store.locations.find(l => l.id === req.params.id);
    if (!loc) return res.status(404).json({ error: 'Sede no encontrada' });
    const { nombre, direccion, telefono, horario, lat, lng } = req.body;
    if (nombre !== undefined) loc.nombre = nombre;
    if (direccion !== undefined) loc.direccion = direccion;
    if (telefono !== undefined) loc.telefono = telefono;
    if (horario !== undefined) loc.horario = horario;
    if (lat !== undefined) loc.lat = Number(lat);
    if (lng !== undefined) loc.lng = Number(lng);
    save();
    res.json(loc);
  } catch (err) { next(err); }
});

// DELETE /admin/locations/:id
router.delete('/locations/:id', (req, res, next) => {
  try {
    const store = getStore();
    const loc = store.locations.find(l => l.id === req.params.id);
    if (!loc) return res.status(404).json({ error: 'Sede no encontrada' });
    const inUse = store.doctors.some(d => (d.sedes || []).includes(req.params.id));
    if (inUse) {
      return res.status(400).json({ error: 'La sede está asignada a uno o más doctores' });
    }
    store.locations = store.locations.filter(l => l.id !== req.params.id);
    save();
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── ESPECIALIDADES ───────────────────────────────────────────────────────────

// GET /admin/specialties
router.get('/specialties', (req, res, next) => {
  try {
    res.json(getStore().specialties);
  } catch (err) { next(err); }
});

// POST /admin/specialties
router.post('/specialties', (req, res, next) => {
  try {
    const store = getStore();
    const { nombre, icono, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
    const newSpec = {
      id: uuidv4(),
      nombre,
      icono: icono || 'Stethoscope',
      descripcion: descripcion || '',
    };
    store.specialties.push(newSpec);
    save();
    res.status(201).json(newSpec);
  } catch (err) { next(err); }
});

// PUT /admin/specialties/:id
router.put('/specialties/:id', (req, res, next) => {
  try {
    const store = getStore();
    const spec = store.specialties.find(s => s.id === req.params.id);
    if (!spec) return res.status(404).json({ error: 'Especialidad no encontrada' });
    const { nombre, icono, descripcion } = req.body;
    if (nombre !== undefined) spec.nombre = nombre;
    if (icono !== undefined) spec.icono = icono;
    if (descripcion !== undefined) spec.descripcion = descripcion;
    save();
    res.json(spec);
  } catch (err) { next(err); }
});

// DELETE /admin/specialties/:id
router.delete('/specialties/:id', (req, res, next) => {
  try {
    const store = getStore();
    const spec = store.specialties.find(s => s.id === req.params.id);
    if (!spec) return res.status(404).json({ error: 'Especialidad no encontrada' });
    const inUse = store.doctors.some(d => d.especialidad_id === req.params.id);
    if (inUse) {
      return res.status(400).json({ error: 'La especialidad está asignada a uno o más doctores' });
    }
    store.specialties = store.specialties.filter(s => s.id !== req.params.id);
    save();
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
