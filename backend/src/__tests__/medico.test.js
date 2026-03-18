const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'dev-secret-only-for-local-dev';

// ── Mock de la base de datos (in-memory) ─────────────────────────────────────
let mockStore;

jest.mock('../config/db', () => ({
  getStore: () => mockStore,
  save: jest.fn(),
  initDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../config/mailer', () => ({
  sendRecoveryEmail: jest.fn().mockResolvedValue({}),
  sendAppointmentConfirmation: jest.fn().mockResolvedValue({}),
  sendConsultaCompletada: jest.fn().mockResolvedValue({}),
  sendRenewalResult: jest.fn().mockResolvedValue({}),
  isConfigured: false,
}));

const app = require('../app');

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayStr = new Date().toISOString().split('T')[0];

// Fecha futura 60 días (para fecha_fin de medicamentos activos)
const futureDate60 = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split('T')[0];
})();

// Fecha esperada al aprobar renovación desde fecha_fin futura (futureDate60 + 30)
const expectedRenewalDateFromFuture = (() => {
  const d = new Date(futureDate60 + 'T00:00:00');
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
})();

// Fecha esperada al aprobar renovación con med vencido (today + 30)
const expectedRenewalDateFromToday = (() => {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
})();

const makeToken = (payload) =>
  jwt.sign({ jti: 'test-jti', ...payload }, JWT_SECRET, { expiresIn: '1h' });

const medicoHeader = (medicoId = 'doc-1') => ({
  Authorization: `Bearer ${makeToken({ userId: 'medico-user-1', role: 'medico', medicoId })}`,
});

const pacienteHeader = () => ({
  Authorization: `Bearer ${makeToken({ userId: 'user-1', role: 'paciente' })}`,
});

const makeAppointment = (overrides = {}) => ({
  id: 'apt-1',
  user_id: 'user-1',
  medico_id: 'doc-1',
  especialidad_nombre: 'Medicina General',
  medico: 'Dr. García',
  sede: 'Sede Norte',
  fecha: todayStr,
  hora: '10:00',
  estado: 'confirmada',
  reagendamientos: 0,
  notas: '',
  diagnostico: null,
  motivo_cancelacion: null,
  ...overrides,
});

const makeMedication = (overrides = {}) => ({
  id: 'med-1',
  user_id: 'user-1',
  nombre: 'Metformina',
  dosis: '500mg',
  presentacion: 'Tabletas',
  frecuencia: 'Cada 8 horas',
  horarios: ['08:00', '16:00', '22:00'],
  fecha_inicio: '2026-01-01',
  fecha_fin: futureDate60,
  medico: 'Dr. García',
  renovable: true,
  instrucciones: 'Tomar con comida',
  ...overrides,
});

const makeRenewal = (overrides = {}) => ({
  id: 'ren-1',
  medication_id: 'med-1',
  medication_nombre: 'Metformina',
  medication_dosis: '500mg',
  user_id: 'user-1',
  medico: 'Dr. García',
  estado: 'pendiente',
  created_at: new Date().toISOString(),
  ...overrides,
});

const resetStore = ({
  appointments = [],
  medications = [],
  renewal_requests = [],
  medical_history = [],
  medication_taken_log = [],
} = {}) => {
  mockStore = {
    users: [{
      id: 'user-1',
      cedula: '1234567890',
      nombre: 'Maria',
      apellido: 'Rodriguez',
      email: 'maria@test.com',
      celular: '3001234567',
      fecha_nacimiento: '1990-05-15',
      departamento: 'Cundinamarca',
      municipio: 'Bogota',
      password_hash: '$2b$10$test',
      activo: true,
      intentos_fallidos: 0,
      bloqueado_hasta: null,
      reset_code: null,
      reset_code_expires: null,
      fecha_registro: '2024-01-01',
      role: 'paciente',
    }],
    doctors: [{
      id: 'doc-1',
      nombre: 'Dr. García',
      especialidad: 'Medicina General',
    }],
    appointments,
    medications,
    medication_taken_log,
    medical_history,
    renewal_requests,
  };
};

// ── Tests: GET /api/medico/dashboard ─────────────────────────────────────────
describe('GET /api/medico/dashboard', () => {
  it('devuelve todos los stats en cero cuando no hay citas', async () => {
    resetStore();

    const res = await request(app)
      .get('/api/medico/dashboard')
      .set(medicoHeader());

    expect(res.status).toBe(200);
    expect(res.body.todayTotal).toBe(0);
    expect(res.body.completedToday).toBe(0);
    expect(res.body.pendingToday).toBe(0);
    expect(res.body.pendingRenewals).toBe(0);
    expect(res.body.recentPatients).toBe(0);
    expect(res.body.upcoming).toHaveLength(0);
  });

  it('calcula todayTotal excluyendo las citas canceladas de hoy', async () => {
    resetStore({
      appointments: [
        makeAppointment({ id: 'apt-1', estado: 'confirmada', fecha: todayStr }),
        makeAppointment({ id: 'apt-2', estado: 'cancelada',  fecha: todayStr }),
        makeAppointment({ id: 'apt-3', estado: 'completada', fecha: todayStr }),
      ],
    });

    const res = await request(app)
      .get('/api/medico/dashboard')
      .set(medicoHeader());

    expect(res.status).toBe(200);
    expect(res.body.todayTotal).toBe(2); // confirmada + completada
  });

  it('calcula completedToday y pendingToday correctamente', async () => {
    resetStore({
      appointments: [
        makeAppointment({ id: 'apt-1', estado: 'completada', fecha: todayStr }),
        makeAppointment({ id: 'apt-2', estado: 'completada', fecha: todayStr }),
        makeAppointment({ id: 'apt-3', estado: 'confirmada', fecha: todayStr }),
      ],
    });

    const res = await request(app)
      .get('/api/medico/dashboard')
      .set(medicoHeader());

    expect(res.body.completedToday).toBe(2);
    expect(res.body.pendingToday).toBe(1);
  });

  it('calcula pendingRenewals solo para medicamentos de este médico', async () => {
    resetStore({
      medications: [
        makeMedication({ id: 'med-1', medico: 'Dr. García' }),
        makeMedication({ id: 'med-2', medico: 'Otro Médico' }),
      ],
      renewal_requests: [
        makeRenewal({ id: 'ren-1', medication_id: 'med-1', estado: 'pendiente' }),
        makeRenewal({ id: 'ren-2', medication_id: 'med-1', estado: 'aprobada' }),
        makeRenewal({ id: 'ren-3', medication_id: 'med-2', estado: 'pendiente' }), // otro médico
      ],
    });

    const res = await request(app)
      .get('/api/medico/dashboard')
      .set(medicoHeader());

    expect(res.body.pendingRenewals).toBe(1); // solo ren-1
  });

  it('no incluye citas de otro médico en upcoming', async () => {
    resetStore({
      appointments: [
        makeAppointment({ id: 'apt-1', medico_id: 'doc-1', fecha: todayStr }),
        makeAppointment({ id: 'apt-2', medico_id: 'doc-2', fecha: todayStr }), // otro médico
      ],
    });

    const res = await request(app)
      .get('/api/medico/dashboard')
      .set(medicoHeader('doc-1'));

    expect(res.body.upcoming).toHaveLength(1);
    expect(res.body.upcoming[0].id).toBe('apt-1');
  });

  it('upcoming incluye datos del paciente', async () => {
    resetStore({
      appointments: [makeAppointment()],
    });

    const res = await request(app)
      .get('/api/medico/dashboard')
      .set(medicoHeader());

    expect(res.body.upcoming[0].paciente).toBeDefined();
    expect(res.body.upcoming[0].paciente.cedula).toBe('1234567890');
  });

  it('rechaza a un paciente (rol incorrecto)', async () => {
    resetStore();

    const res = await request(app)
      .get('/api/medico/dashboard')
      .set(pacienteHeader());

    expect(res.status).toBe(403);
  });

  it('rechaza sin token', async () => {
    const res = await request(app).get('/api/medico/dashboard');
    expect(res.status).toBe(401);
  });
});

// ── Tests: GET /api/medico/appointments ──────────────────────────────────────
describe('GET /api/medico/appointments', () => {
  beforeEach(() => resetStore({
    appointments: [
      makeAppointment({ id: 'apt-1', medico_id: 'doc-1', fecha: todayStr,     estado: 'confirmada' }),
      makeAppointment({ id: 'apt-2', medico_id: 'doc-1', fecha: '2026-11-20', estado: 'completada' }),
      makeAppointment({ id: 'apt-3', medico_id: 'doc-2', fecha: todayStr,     estado: 'confirmada' }), // otro médico
    ],
  }));

  it('devuelve solo las citas del médico autenticado', async () => {
    const res = await request(app)
      .get('/api/medico/appointments')
      .set(medicoHeader('doc-1'));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map(a => a.id)).not.toContain('apt-3');
  });

  it('filtra por fecha', async () => {
    const res = await request(app)
      .get('/api/medico/appointments')
      .query({ date: todayStr })
      .set(medicoHeader('doc-1'));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('apt-1');
  });

  it('filtra por estado', async () => {
    const res = await request(app)
      .get('/api/medico/appointments')
      .query({ status: 'completada' })
      .set(medicoHeader('doc-1'));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('apt-2');
  });

  it('enriquece las citas con datos del paciente', async () => {
    const res = await request(app)
      .get('/api/medico/appointments')
      .set(medicoHeader('doc-1'));

    const apt = res.body.find(a => a.id === 'apt-1');
    expect(apt.paciente).toBeDefined();
    expect(apt.paciente.cedula).toBe('1234567890');
    expect(apt.paciente.email).toBe('maria@test.com');
  });

  it('rechaza sin token', async () => {
    const res = await request(app).get('/api/medico/appointments');
    expect(res.status).toBe(401);
  });
});

// ── Tests: PATCH /api/medico/appointments/:id/complete ───────────────────────
describe('PATCH /api/medico/appointments/:id/complete', () => {
  beforeEach(() => resetStore({
    appointments: [makeAppointment({ id: 'apt-1', medico_id: 'doc-1', estado: 'confirmada' })],
    medical_history: [],
  }));

  it('completa la cita y actualiza estado y diagnóstico', async () => {
    const res = await request(app)
      .patch('/api/medico/appointments/apt-1/complete')
      .set(medicoHeader())
      .send({ diagnostico: 'Hipertensión leve', notas: 'Control en 3 meses' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockStore.appointments[0].estado).toBe('completada');
    expect(mockStore.appointments[0].diagnostico).toBe('Hipertensión leve');
    expect(mockStore.appointments[0].notas).toBe('Control en 3 meses');
  });

  it('crea una entrada en medical_history con recetas y exámenes', async () => {
    const recetas = ['Metformina 500mg', 'Atorvastatina 20mg'];
    const examenes = ['Hemograma', 'Glucosa en ayunas'];

    await request(app)
      .patch('/api/medico/appointments/apt-1/complete')
      .set(medicoHeader())
      .send({ diagnostico: 'Diabetes tipo 2', recetas, examenes });

    expect(mockStore.medical_history).toHaveLength(1);
    const entry = mockStore.medical_history[0];
    expect(entry.diagnostico).toBe('Diabetes tipo 2');
    expect(entry.recetas).toEqual(recetas);
    expect(entry.examenes).toEqual(examenes);
    expect(entry.user_id).toBe('user-1');
  });

  it('almacena recetas y exámenes como arrays vacíos si no se proveen', async () => {
    await request(app)
      .patch('/api/medico/appointments/apt-1/complete')
      .set(medicoHeader())
      .send({ diagnostico: 'Sin hallazgos' });

    const entry = mockStore.medical_history[0];
    expect(entry.recetas).toEqual([]);
    expect(entry.examenes).toEqual([]);
  });

  it('falla con 400 si el diagnóstico está ausente', async () => {
    const res = await request(app)
      .patch('/api/medico/appointments/apt-1/complete')
      .set(medicoHeader())
      .send({ notas: 'Solo notas sin diagnóstico' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/diagnóstico/i);
  });

  it('falla con 400 si el diagnóstico es solo espacios', async () => {
    const res = await request(app)
      .patch('/api/medico/appointments/apt-1/complete')
      .set(medicoHeader())
      .send({ diagnostico: '   ' });

    expect(res.status).toBe(400);
  });

  it('falla con 404 si la cita pertenece a otro médico', async () => {
    const res = await request(app)
      .patch('/api/medico/appointments/apt-1/complete')
      .set(medicoHeader('doc-2')) // diferente médico
      .send({ diagnostico: 'Test' });

    expect(res.status).toBe(404);
  });

  it('falla con 400 si la cita ya está completada', async () => {
    mockStore.appointments[0].estado = 'completada';

    const res = await request(app)
      .patch('/api/medico/appointments/apt-1/complete')
      .set(medicoHeader())
      .send({ diagnostico: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya fue completada/i);
  });

  it('falla con 400 si la cita está cancelada', async () => {
    mockStore.appointments[0].estado = 'cancelada';

    const res = await request(app)
      .patch('/api/medico/appointments/apt-1/complete')
      .set(medicoHeader())
      .send({ diagnostico: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cancelada/i);
  });

  it('rechaza sin token', async () => {
    const res = await request(app)
      .patch('/api/medico/appointments/apt-1/complete')
      .send({ diagnostico: 'Test' });

    expect(res.status).toBe(401);
  });
});

// ── Tests: GET /api/medico/patients/:userId ───────────────────────────────────
describe('GET /api/medico/patients/:userId', () => {
  beforeEach(() => resetStore({
    appointments: [makeAppointment({ user_id: 'user-1', medico_id: 'doc-1' })],
    medications: [makeMedication({ user_id: 'user-1' })],
    medical_history: [{
      id: 'hist-1',
      user_id: 'user-1',
      fecha: '2026-01-15',
      especialidad: 'Medicina General',
      medico: 'Dr. García',
      diagnostico: 'Control rutinario',
      recetas: [],
      examenes: [],
    }],
  }));

  it('devuelve datos del paciente con historial, medicamentos y citas', async () => {
    const res = await request(app)
      .get('/api/medico/patients/user-1')
      .set(medicoHeader('doc-1'));

    expect(res.status).toBe(200);
    expect(res.body.paciente.cedula).toBe('1234567890');
    expect(res.body.historialMedico).toHaveLength(1);
    expect(res.body.medicamentos).toHaveLength(1);
    expect(res.body.citas).toHaveLength(1);
  });

  it('falla con 404 si el paciente no existe', async () => {
    const res = await request(app)
      .get('/api/medico/patients/no-existe')
      .set(medicoHeader());

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });

  it('falla con 403 si el médico no tiene citas con ese paciente', async () => {
    const res = await request(app)
      .get('/api/medico/patients/user-1')
      .set(medicoHeader('doc-2')); // médico diferente

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/acceso/i);
  });

  it('rechaza sin token', async () => {
    const res = await request(app).get('/api/medico/patients/user-1');
    expect(res.status).toBe(401);
  });
});

// ── Tests: GET /api/medico/renewals ──────────────────────────────────────────
describe('GET /api/medico/renewals', () => {
  beforeEach(() => resetStore({
    medications: [
      makeMedication({ id: 'med-1', medico: 'Dr. García' }),
      makeMedication({ id: 'med-2', medico: 'Otro Médico' }),
    ],
    renewal_requests: [
      makeRenewal({ id: 'ren-1', medication_id: 'med-1', estado: 'pendiente' }),
      makeRenewal({ id: 'ren-2', medication_id: 'med-2', estado: 'pendiente' }), // otro médico
    ],
  }));

  it('devuelve solo las renovaciones de medicamentos de este médico', async () => {
    const res = await request(app)
      .get('/api/medico/renewals')
      .set(medicoHeader('doc-1'));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('ren-1');
  });

  it('enriquece con datos del medicamento y del paciente', async () => {
    const res = await request(app)
      .get('/api/medico/renewals')
      .set(medicoHeader('doc-1'));

    const renewal = res.body[0];
    expect(renewal.medicamento).toBeDefined();
    expect(renewal.medicamento.nombre).toBe('Metformina');
    expect(renewal.paciente).toBeDefined();
    expect(renewal.paciente.cedula).toBe('1234567890');
  });

  it('rechaza sin token', async () => {
    const res = await request(app).get('/api/medico/renewals');
    expect(res.status).toBe(401);
  });
});

// ── Tests: PATCH /api/medico/renewals/:id ────────────────────────────────────
describe('PATCH /api/medico/renewals/:id', () => {
  const setupRenewal = (medOverrides = {}, renewalOverrides = {}) => {
    resetStore({
      medications: [makeMedication({ id: 'med-1', medico: 'Dr. García', ...medOverrides })],
      renewal_requests: [makeRenewal({ id: 'ren-1', medication_id: 'med-1', estado: 'pendiente', ...renewalOverrides })],
    });
  };

  it('aprueba la renovación y extiende fecha_fin desde currentEnd cuando está en el futuro', async () => {
    setupRenewal({ fecha_fin: futureDate60 });

    const res = await request(app)
      .patch('/api/medico/renewals/ren-1')
      .set(medicoHeader())
      .send({ action: 'approve' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockStore.renewal_requests[0].estado).toBe('aprobada');
    expect(mockStore.medications[0].fecha_fin).toBe(expectedRenewalDateFromFuture);
  });

  it('aprueba la renovación y extiende fecha_fin desde hoy cuando el medicamento está vencido', async () => {
    setupRenewal({ fecha_fin: '2020-01-01' });

    const res = await request(app)
      .patch('/api/medico/renewals/ren-1')
      .set(medicoHeader())
      .send({ action: 'approve' });

    expect(res.status).toBe(200);
    expect(mockStore.medications[0].fecha_fin).toBe(expectedRenewalDateFromToday);
  });

  it('rechaza la renovación y actualiza estado a rechazada', async () => {
    setupRenewal();

    const res = await request(app)
      .patch('/api/medico/renewals/ren-1')
      .set(medicoHeader())
      .send({ action: 'reject', nota: 'No es necesaria en este momento' });

    expect(res.status).toBe(200);
    expect(mockStore.renewal_requests[0].estado).toBe('rechazada');
    expect(mockStore.renewal_requests[0].nota_medico).toBe('No es necesaria en este momento');
    // Al rechazar, fecha_fin no debe cambiar
    expect(mockStore.medications[0].fecha_fin).toBe(futureDate60);
  });

  it('falla con 400 si la acción es inválida', async () => {
    setupRenewal();

    const res = await request(app)
      .patch('/api/medico/renewals/ren-1')
      .set(medicoHeader())
      .send({ action: 'delete' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inválida/i);
  });

  it('falla con 400 si la solicitud ya fue procesada', async () => {
    setupRenewal({}, { estado: 'aprobada' });

    const res = await request(app)
      .patch('/api/medico/renewals/ren-1')
      .set(medicoHeader())
      .send({ action: 'approve' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya fue procesada/i);
  });

  it('falla con 404 si la solicitud no existe', async () => {
    setupRenewal();

    const res = await request(app)
      .patch('/api/medico/renewals/no-existe')
      .set(medicoHeader())
      .send({ action: 'approve' });

    expect(res.status).toBe(404);
  });

  it('falla con 403 si el medicamento no pertenece a este médico', async () => {
    setupRenewal({ medico: 'Otro Médico' });

    const res = await request(app)
      .patch('/api/medico/renewals/ren-1')
      .set(medicoHeader('doc-1')) // doc-1 es "Dr. García", no "Otro Médico"
      .send({ action: 'approve' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/permiso/i);
  });

  it('rechaza sin token', async () => {
    const res = await request(app)
      .patch('/api/medico/renewals/ren-1')
      .send({ action: 'approve' });

    expect(res.status).toBe(401);
  });
});

// ── Tests: POST /api/medico/prescriptions ────────────────────────────────────
describe('POST /api/medico/prescriptions', () => {
  const validPayload = () => ({
    userId: 'user-1',
    nombre: 'Atorvastatina',
    dosis: '20mg',
    presentacion: 'Tableta',
    frecuencia: 'Una vez al día',
    horarios: ['22:00'],
    duracionDias: 30,
    instrucciones: 'Tomar en la noche',
    renovable: true,
  });

  beforeEach(() => resetStore({
    appointments: [makeAppointment({ user_id: 'user-1', medico_id: 'doc-1' })],
  }));

  it('crea el medicamento correctamente', async () => {
    const res = await request(app)
      .post('/api/medico/prescriptions')
      .set(medicoHeader('doc-1'))
      .send(validPayload());

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.nombre).toBe('Atorvastatina');
    expect(res.body.user_id).toBe('user-1');
    expect(res.body.medico).toBe('Dr. García');
    expect(res.body.renovable).toBe(true);
    expect(mockStore.medications).toHaveLength(1);
  });

  it('calcula fecha_fin sumando duracionDias desde hoy', async () => {
    const res = await request(app)
      .post('/api/medico/prescriptions')
      .set(medicoHeader('doc-1'))
      .send(validPayload());

    const today = new Date();
    const expectedFin = new Date(today);
    expectedFin.setDate(expectedFin.getDate() + 30);
    const expectedFinStr = expectedFin.toISOString().split('T')[0];

    expect(res.body.fecha_fin).toBe(expectedFinStr);
  });

  it('falla con 400 si faltan nombre, dosis o frecuencia', async () => {
    const res = await request(app)
      .post('/api/medico/prescriptions')
      .set(medicoHeader())
      .send({ ...validPayload(), nombre: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/requeridos/i);
  });

  it('falla con 400 si horarios es un array vacío', async () => {
    const res = await request(app)
      .post('/api/medico/prescriptions')
      .set(medicoHeader())
      .send({ ...validPayload(), horarios: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/horarios/i);
  });

  it('falla con 400 si duracionDias no es un número positivo', async () => {
    const res = await request(app)
      .post('/api/medico/prescriptions')
      .set(medicoHeader())
      .send({ ...validPayload(), duracionDias: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/duracionDias/i);
  });

  it('falla con 400 si duracionDias es cero', async () => {
    const res = await request(app)
      .post('/api/medico/prescriptions')
      .set(medicoHeader())
      .send({ ...validPayload(), duracionDias: 0 });

    expect(res.status).toBe(400);
  });

  it('falla con 404 si el paciente no existe', async () => {
    const res = await request(app)
      .post('/api/medico/prescriptions')
      .set(medicoHeader())
      .send({ ...validPayload(), userId: 'no-existe' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });

  it('falla con 403 si el médico no tiene citas con ese paciente', async () => {
    const res = await request(app)
      .post('/api/medico/prescriptions')
      .set(medicoHeader('doc-2')) // no tiene citas con user-1
      .send(validPayload());

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/acceso/i);
  });

  it('rechaza sin token', async () => {
    const res = await request(app)
      .post('/api/medico/prescriptions')
      .send(validPayload());

    expect(res.status).toBe(401);
  });
});
