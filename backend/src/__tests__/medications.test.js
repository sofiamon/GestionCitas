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
  isConfigured: false,
}));

const app = require('../app');

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeToken = (userId = 'user-1', role = 'paciente') =>
  jwt.sign({ userId, role, jti: 'test-jti-' + userId }, JWT_SECRET, { expiresIn: '1h' });

const authHeader = (userId = 'user-1') => ({
  Authorization: `Bearer ${makeToken(userId)}`,
});

// Fecha futura: 30 días desde hoy (para diasRestantes > 0)
const futureDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
})();

// Días restantes esperados según la misma lógica del servidor
const expectedDiasRestantes = (() => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(futureDate + 'T00:00:00');
  return Math.max(0, Math.ceil((end - today) / 86400000));
})();

const makeMedication = (overrides = {}) => ({
  id: 'med-1',
  user_id: 'user-1',
  nombre: 'Metformina',
  dosis: '500mg',
  presentacion: 'Tabletas',
  frecuencia: 'Cada 8 horas',
  horarios: ['08:00', '16:00', '22:00'],
  fecha_inicio: '2026-01-01',
  fecha_fin: futureDate,
  medico: 'Dr. García',
  renovable: true,
  instrucciones: 'Tomar con comida',
  ...overrides,
});

const resetStore = ({ medications = [], medication_taken_log = [], renewal_requests = [] } = {}) => {
  mockStore = {
    users: [{
      id: 'user-1',
      cedula: '1234567890',
      nombre: 'Maria',
      apellido: 'Rodriguez',
      email: 'maria@test.com',
      password_hash: '$2b$10$test',
      activo: true,
      intentos_fallidos: 0,
      bloqueado_hasta: null,
      reset_code: null,
      reset_code_expires: null,
      fecha_registro: '2024-01-01',
      role: 'paciente',
    }],
    appointments: [],
    medications,
    medication_taken_log,
    renewal_requests,
  };
};

// ── Tests: GET /api/medications ───────────────────────────────────────────────
describe('GET /api/medications', () => {
  beforeEach(() => resetStore({
    medications: [
      makeMedication({ id: 'med-1', user_id: 'user-1' }),
      makeMedication({ id: 'med-2', user_id: 'other-user' }), // de otro usuario
    ],
  }));

  it('retorna solo los medicamentos del usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/medications')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('med-1');
  });

  it('calcula diasRestantes correctamente para fecha futura', async () => {
    const res = await request(app)
      .get('/api/medications')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body[0].diasRestantes).toBe(expectedDiasRestantes);
  });

  it('diasRestantes es 0 para medicamentos vencidos', async () => {
    resetStore({
      medications: [makeMedication({ fecha_fin: '2020-01-01' })],
    });

    const res = await request(app)
      .get('/api/medications')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body[0].diasRestantes).toBe(0);
  });

  it('incluye los campos esperados en la respuesta', async () => {
    const res = await request(app)
      .get('/api/medications')
      .set(authHeader());

    const med = res.body[0];
    expect(med).toHaveProperty('id');
    expect(med).toHaveProperty('nombre');
    expect(med).toHaveProperty('dosis');
    expect(med).toHaveProperty('presentacion');
    expect(med).toHaveProperty('horarios');
    expect(med).toHaveProperty('diasRestantes');
    expect(med).toHaveProperty('renovable');
    expect(med).toHaveProperty('medico');
    // user_id no debe exponerse
    expect(med).not.toHaveProperty('user_id');
  });

  it('retorna lista vacía si el usuario no tiene medicamentos', async () => {
    resetStore({ medications: [] });

    const res = await request(app)
      .get('/api/medications')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('rechaza sin token', async () => {
    const res = await request(app).get('/api/medications');
    expect(res.status).toBe(401);
  });
});

// ── Tests: POST /api/medications/:id/taken ────────────────────────────────────
describe('POST /api/medications/:id/taken', () => {
  beforeEach(() => resetStore({
    medications: [makeMedication({ id: 'med-1', user_id: 'user-1' })],
  }));

  it('registra una dosis tomada correctamente', async () => {
    const res = await request(app)
      .post('/api/medications/med-1/taken')
      .set(authHeader())
      .send({ horario: '08:00' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.timestamp).toBeDefined();
    expect(mockStore.medication_taken_log).toHaveLength(1);
    expect(mockStore.medication_taken_log[0].medication_id).toBe('med-1');
    expect(mockStore.medication_taken_log[0].user_id).toBe('user-1');
    expect(mockStore.medication_taken_log[0].horario).toBe('08:00');
  });

  it('registra la fecha de hoy en el log', async () => {
    await request(app)
      .post('/api/medications/med-1/taken')
      .set(authHeader())
      .send({ horario: '08:00' });

    const today = new Date().toISOString().split('T')[0];
    expect(mockStore.medication_taken_log[0].fecha).toBe(today);
  });

  it('falla con 404 si el medicamento no pertenece al usuario', async () => {
    const res = await request(app)
      .post('/api/medications/med-1/taken')
      .set(authHeader('other-user'))
      .send({ horario: '08:00' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });

  it('falla con 404 si el medicamento no existe', async () => {
    const res = await request(app)
      .post('/api/medications/no-existe/taken')
      .set(authHeader())
      .send({ horario: '08:00' });

    expect(res.status).toBe(404);
  });

  it('rechaza sin token', async () => {
    const res = await request(app)
      .post('/api/medications/med-1/taken')
      .send({ horario: '08:00' });

    expect(res.status).toBe(401);
  });
});

// ── Tests: GET /api/medications/taken-today ───────────────────────────────────
describe('GET /api/medications/taken-today', () => {
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => resetStore({
    medications: [makeMedication()],
    medication_taken_log: [
      {
        id: 'log-1',
        medication_id: 'med-1',
        user_id: 'user-1',
        horario: '08:00',
        taken_at: new Date().toISOString(),
        fecha: today,
      },
      {
        id: 'log-2',
        medication_id: 'med-1',
        user_id: 'other-user', // de otro usuario → no debe aparecer
        horario: '08:00',
        taken_at: new Date().toISOString(),
        fecha: today,
      },
      {
        id: 'log-3',
        medication_id: 'med-1',
        user_id: 'user-1',
        horario: '16:00',
        taken_at: new Date().toISOString(),
        fecha: '2020-01-01', // día anterior → no debe aparecer
      },
    ],
  }));

  it('retorna un mapa con las dosis tomadas hoy del usuario', async () => {
    const res = await request(app)
      .get('/api/medications/taken-today')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body['med-1-08:00']).toBeDefined();
  });

  it('no incluye dosis de otros usuarios', async () => {
    const res = await request(app)
      .get('/api/medications/taken-today')
      .set(authHeader());

    // Solo log-1 cumple user-1 + fecha hoy
    expect(Object.keys(res.body)).toHaveLength(1);
  });

  it('no incluye dosis de días anteriores', async () => {
    const res = await request(app)
      .get('/api/medications/taken-today')
      .set(authHeader());

    // log-3 es de user-1 pero fecha pasada
    expect(res.body['med-1-16:00']).toBeUndefined();
  });

  it('retorna objeto vacío si no hay dosis registradas hoy', async () => {
    resetStore({ medication_taken_log: [] });

    const res = await request(app)
      .get('/api/medications/taken-today')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('rechaza sin token', async () => {
    const res = await request(app).get('/api/medications/taken-today');
    expect(res.status).toBe(401);
  });
});

// ── Tests: POST /api/medications/:id/renewal ──────────────────────────────────
describe('POST /api/medications/:id/renewal', () => {
  beforeEach(() => resetStore({
    medications: [
      makeMedication({ id: 'med-1', user_id: 'user-1', renovable: true }),
      makeMedication({ id: 'med-2', user_id: 'user-1', renovable: false }),
    ],
    renewal_requests: [],
  }));

  it('crea una solicitud de renovación correctamente', async () => {
    const res = await request(app)
      .post('/api/medications/med-1/renewal')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.renewalId).toBeDefined();
    expect(mockStore.renewal_requests).toHaveLength(1);
    expect(mockStore.renewal_requests[0].estado).toBe('pendiente');
    expect(mockStore.renewal_requests[0].medication_id).toBe('med-1');
    expect(mockStore.renewal_requests[0].user_id).toBe('user-1');
  });

  it('falla con 400 si el medicamento no es renovable', async () => {
    const res = await request(app)
      .post('/api/medications/med-2/renewal')
      .set(authHeader());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no es renovable/i);
  });

  it('falla con 409 si ya hay una solicitud pendiente', async () => {
    // Primera solicitud
    await request(app)
      .post('/api/medications/med-1/renewal')
      .set(authHeader());

    // Intento duplicado
    const res = await request(app)
      .post('/api/medications/med-1/renewal')
      .set(authHeader());

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/pendiente/i);
    expect(mockStore.renewal_requests).toHaveLength(1); // no se creó una segunda
  });

  it('falla con 404 si el medicamento no pertenece al usuario', async () => {
    const res = await request(app)
      .post('/api/medications/med-1/renewal')
      .set(authHeader('other-user'));

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });

  it('falla con 404 si el medicamento no existe', async () => {
    const res = await request(app)
      .post('/api/medications/no-existe/renewal')
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it('permite nueva solicitud si la solicitud anterior ya fue procesada', async () => {
    mockStore.renewal_requests = [{
      id: 'req-1',
      medication_id: 'med-1',
      user_id: 'user-1',
      estado: 'aprobada', // ya procesada, no bloquea
    }];

    const res = await request(app)
      .post('/api/medications/med-1/renewal')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rechaza sin token', async () => {
    const res = await request(app).post('/api/medications/med-1/renewal');
    expect(res.status).toBe(401);
  });
});
