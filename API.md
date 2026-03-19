# EPS — Documentación de la API REST

Base URL: `http://localhost:3001/api`

Todos los endpoints que requieren autenticación esperan el header:
```
Authorization: Bearer <token>
```

---

## Tabla resumen

| Método | Ruta | Auth | Rol |
|---|---|---|---|
| POST | /auth/login | No | — |
| POST | /auth/register | No | — |
| POST | /auth/recover-password | No | — |
| POST | /auth/verify-code | No | — |
| POST | /auth/reset-password | No | — |
| POST | /auth/logout | Sí | — |
| GET | /appointments | Sí | — |
| POST | /appointments | Sí | — |
| PATCH | /appointments/:id/cancel | Sí | — |
| PATCH | /appointments/:id/reschedule | Sí | — |
| GET | /medications | Sí | — |
| GET | /medications/taken-today | Sí | — |
| POST | /medications/:id/taken | Sí | — |
| POST | /medications/:id/renewal | Sí | — |
| GET | /medical-history | Sí | — |
| PUT | /profile | Sí | — |
| POST | /profile/change-password | Sí | — |
| GET | /doctors | Sí | — |
| GET | /doctors/:id/available-times | Sí | — |
| GET | /locations | Sí | — |
| GET | /specialties | Sí | — |
| GET | /departments | No | — |
| GET | /medico/dashboard | Sí | medico |
| GET | /medico/appointments | Sí | medico |
| PATCH | /medico/appointments/:id/complete | Sí | medico |
| GET | /medico/patients/:userId | Sí | medico |
| GET | /medico/renewals | Sí | medico |
| PATCH | /medico/renewals/:id | Sí | medico |
| GET | /admin/dashboard | Sí | admin |
| GET | /admin/users | Sí | admin |
| PATCH | /admin/users/:id/toggle-active | Sí | admin |
| PATCH | /admin/users/:id/change-role | Sí | admin |
| GET | /admin/doctors | Sí | admin |
| POST | /admin/doctors | Sí | admin |
| PUT | /admin/doctors/:id | Sí | admin |
| DELETE | /admin/doctors/:id | Sí | admin |
| GET | /admin/locations | Sí | admin |
| POST | /admin/locations | Sí | admin |
| PUT | /admin/locations/:id | Sí | admin |
| DELETE | /admin/locations/:id | Sí | admin |
| GET | /admin/specialties | Sí | admin |
| POST | /admin/specialties | Sí | admin |
| PUT | /admin/specialties/:id | Sí | admin |
| DELETE | /admin/specialties/:id | Sí | admin |

---

## 1. Autenticación (`/api/auth`)

### POST /auth/login

Inicia sesión con cédula y contraseña.

**Body**
```json
{ "cedula": "1234567890", "password": "Password123!" }
```

**Respuesta 200**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": "1", "cedula": "1234567890", "nombre": "María",
    "apellido": "Rodríguez", "email": "...", "role": "paciente", "medicoId": null
  }
}
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | Cedula y contrasena son requeridas |
| 401 | Este numero de cedula no esta registrado. Deseas crear una cuenta? |
| 401 | Tu cuenta esta inactiva. Contacta a servicio al cliente |
| 401 | Tu cuenta ha sido bloqueada temporalmente. Intenta de nuevo en 15 minutos o recupera tu contrasena |
| 401 | Usuario o contrasena incorrectos. Por favor, verifica tus datos |

---

### POST /auth/register

Crea una nueva cuenta de paciente.

**Body**
```json
{
  "cedula": "9876543210",          // obligatorio
  "password": "Password123!",      // obligatorio — mín. 8 chars, mayúscula, minúscula, número, especial
  "nombre": "Juan",                // obligatorio
  "apellido": "García",
  "email": "juan@email.com",       // obligatorio
  "celular": "3001234567",
  "fechaNacimiento": "1990-01-15",
  "departamento": "Cundinamarca",
  "municipio": "Bogotá",
  "direccion": "Cra 7 #32-16"
}
```

**Respuesta 201**
```json
{ "success": true, "message": "Cuenta creada exitosamente!" }
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | La contrasena debe tener al menos 8 caracteres (u otras reglas de contraseña) |
| 400 | Esta cedula ya esta registrada. Deseas iniciar sesion? |
| 400 | Este correo ya esta registrado |

---

### POST /auth/recover-password

Envía un código de recuperación al correo del usuario.

**Body**
```json
{ "identifier": "1234567890" }  // cédula o email
```

**Respuesta 200**
```json
{ "success": true, "message": "Si la cuenta existe, recibirás un correo con el código" }
```
> En modo desarrollo se incluye `_devCode` con el código real para pruebas.

---

### POST /auth/verify-code

Valida el código de recuperación y devuelve un token de reset.

**Body**
```json
{ "identifier": "1234567890", "code": "483921" }
```

**Respuesta 200**
```json
{ "success": true, "resetToken": "<jwt de 10 minutos>" }
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | El codigo es incorrecto |
| 400 | El codigo ha expirado. Solicita uno nuevo |

---

### POST /auth/reset-password

Cambia la contraseña usando el token de reset.

**Body**
```json
{ "resetToken": "<jwt>", "newPassword": "NuevaPassword1!" }
```

**Respuesta 200**
```json
{ "success": true, "message": "Contrasena actualizada exitosamente" }
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | Token invalido o expirado |
| 400 | Token invalido |
| 400 | (reglas de contraseña) |
| 400 | No puedes reutilizar una contraseña reciente |
| 404 | Usuario no encontrado |

---

### POST /auth/logout

Invalida el token actual. **Requiere auth.**

**Respuesta 200**
```json
{ "success": true }
```

---

## 2. Citas (`/api/appointments`)

Todos los endpoints requieren autenticación. Solo se accede a las citas del usuario autenticado.

### GET /appointments

Devuelve todas las citas del usuario, ordenadas por fecha descendente.

**Respuesta 200**
```json
[
  {
    "id": "uuid", "especialidad": "medicina-general",
    "especialidadNombre": "Medicina General", "medico": "Dr. Carlos Mendoza",
    "medicoId": "1", "sede": "Sede Norte", "sedeId": "norte",
    "fecha": "2026-03-25", "hora": "10:00", "estado": "confirmada",
    "reagendamientos": 0, "notas": ""
  }
]
```

---

### POST /appointments

Crea una nueva cita.

**Body**
```json
{
  "especialidad": "medicina-general",
  "especialidadNombre": "Medicina General",
  "medico": "Dr. Carlos Mendoza",
  "medicoId": "1",
  "sede": "Sede Norte",
  "sedeId": "norte",
  "fecha": "2026-04-01",
  "hora": "09:00",
  "notas": ""
}
```

**Respuesta 201** — objeto de cita creada.

**Errores**
| Código | Mensaje |
|---|---|
| 409 | Este horario ya no está disponible. Selecciona otro horario. |

---

### PATCH /appointments/:id/cancel

Cancela una cita. No se puede cancelar con menos de 24 horas de anticipación.

**Body**
```json
{ "motivo": "No puedo asistir" }
```

**Respuesta 200**
```json
{ "success": true }
```

**Errores**
| Código | Mensaje |
|---|---|
| 404 | Cita no encontrada |
| 400 | La cita ya está cancelada |
| 400 | No puedes cancelar con menos de 24 horas de anticipación. Contacta a tu sede. |

---

### PATCH /appointments/:id/reschedule

Reagenda una cita (máximo 2 veces).

**Body**
```json
{ "newDate": "2026-04-10", "newTime": "14:00" }
```

**Respuesta 200**
```json
{ "success": true }
```

**Errores**
| Código | Mensaje |
|---|---|
| 404 | Cita no encontrada |
| 400 | newDate y newTime son requeridos |
| 400 | No puedes reagendar una cita cancelada o completada |
| 400 | Has alcanzado el límite de reagendamientos para esta cita |
| 400 | No puedes reagendar a una fecha pasada |
| 409 | Este horario ya no está disponible. Selecciona otro horario. |

---

## 3. Medicamentos (`/api/medications`)

### GET /medications

Devuelve los medicamentos activos del usuario con días restantes calculados.

**Respuesta 200**
```json
[
  {
    "id": "1", "nombre": "Losartan", "dosis": "50mg",
    "presentacion": "Tableta", "frecuencia": "Cada 12 horas",
    "horarios": ["08:00", "20:00"], "fecha_inicio": "2026-03-01",
    "fecha_fin": "2026-03-27", "medico": "Dr. Carlos Mendoza",
    "renovable": true, "instrucciones": "...", "diasRestantes": 9
  }
]
```

---

### GET /medications/taken-today

Devuelve las dosis registradas hoy.

**Respuesta 200**
```json
{ "1-08:00": "2026-03-18T08:12:00.000Z", "2-07:00": "2026-03-18T07:05:00.000Z" }
```

---

### POST /medications/:id/taken

Registra que el usuario tomó una dosis.

**Body**
```json
{ "horario": "08:00" }
```

**Respuesta 200**
```json
{ "success": true, "timestamp": "2026-03-18T08:12:00.000Z" }
```

**Errores**
| Código | Mensaje |
|---|---|
| 404 | Medicamento no encontrado |

---

### POST /medications/:id/renewal

Solicita la renovación de un medicamento.

**Respuesta 200**
```json
{ "success": true, "renewalId": "uuid", "message": "Solicitud enviada al médico" }
```

**Errores**
| Código | Mensaje |
|---|---|
| 404 | Medicamento no encontrado |
| 400 | Este medicamento no es renovable |
| 409 | Ya tienes una solicitud de renovación pendiente para este medicamento |

---

## 4. Historial Médico (`/api/medical-history`)

### GET /medical-history

Devuelve el historial médico del usuario, ordenado por fecha descendente.

**Respuesta 200**
```json
[
  {
    "id": "1", "fecha": "2024-11-10", "especialidad": "Medicina General",
    "medico": "Dr. Carlos Mendoza", "sede": "Sede Norte",
    "diagnostico": "Hipertensión arterial controlada",
    "notas": "...", "recetas": ["..."], "examenes": ["..."]
  }
]
```

---

## 5. Perfil (`/api/profile`)

### PUT /profile

Actualiza los datos del perfil del usuario autenticado.

**Body** (todos opcionales)
```json
{
  "nombre": "María", "apellido": "Rodríguez", "email": "nuevo@email.com",
  "celular": "3009876543", "fechaNacimiento": "1990-05-15",
  "departamento": "Cundinamarca", "municipio": "Bogotá",
  "direccion": "Cra 15 #82-45", "fotoUrl": "data:image/jpeg;base64,..."
}
```

**Respuesta 200**
```json
{ "success": true, "user": { ...datosDelUsuario } }
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | Este correo ya esta en uso |
| 400 | La foto es demasiado grande. Máximo 2 MB. |
| 404 | Usuario no encontrado |

---

### POST /profile/change-password

Cambia la contraseña del usuario autenticado.

**Body**
```json
{ "currentPassword": "Password123!", "newPassword": "NuevaPassword1!" }
```

**Respuesta 200**
```json
{ "success": true }
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | La contrasena actual es incorrecta |
| 400 | No puedes reutilizar una contraseña reciente. Elige una diferente. |
| 404 | Usuario no encontrado |

---

## 6. Médicos (`/api/doctors`)

### GET /doctors

Devuelve el catálogo de médicos, opcionalmente filtrado por especialidad.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `especialidadId` | string | Filtra por especialidad (ej: `medicina-general`) |

**Respuesta 200** — array de médicos.

---

### GET /doctors/:id/available-times

Devuelve los horarios disponibles de un médico en una fecha, descontando los ya ocupados.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `date` | string | Fecha en formato `YYYY-MM-DD` (obligatorio) |

**Respuesta 200**
```json
["08:00", "09:00", "10:30", "14:00"]
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | date es requerido |

---

## 7. Sedes, Especialidades y Departamentos

### GET /locations

Devuelve las sedes disponibles. Si se pasa `doctorId`, filtra por las sedes del médico.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `doctorId` | string | Filtra sedes donde atiende el médico |

**Respuesta 200** — array de sedes con dirección, teléfono y horario.

---

### GET /specialties

Devuelve todas las especialidades disponibles. **Requiere auth.**

**Respuesta 200** — array de especialidades con `id`, `nombre`, `icono` y `descripcion`.

---

### GET /departments

Devuelve todos los departamentos y sus municipios. **No requiere auth.**

**Respuesta 200**
```json
[{ "id": "cundinamarca", "nombre": "Cundinamarca", "municipios": ["Bogotá", "Soacha", ...] }]
```

---

## 8. Portal Médico (`/api/medico`)

Todos los endpoints requieren autenticación y rol `medico`.

### GET /medico/dashboard

Resumen estadístico del día para el médico autenticado.

**Respuesta 200**
```json
{
  "todayTotal": 8, "completedToday": 3, "pendingToday": 5,
  "pendingRenewals": 2,
  "recentPatients": [...],
  "upcoming": [...]
}
```

---

### GET /medico/appointments

Citas del médico autenticado, enriquecidas con datos del paciente.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `date` | string | Filtra por fecha (`YYYY-MM-DD`) |
| `status` | string | Filtra por estado (`confirmada`, `pendiente`, etc.) |

**Respuesta 200** — array de citas con campo `paciente: { nombreCompleto, cedula }`.

---

### PATCH /medico/appointments/:id/complete

Marca una cita como completada y registra el diagnóstico.

**Body**
```json
{ "diagnostico": "Hipertensión controlada", "notas": "Continuar medicación" }
```

**Respuesta 200**
```json
{ "success": true, "appointment": { ...citaActualizada } }
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | El diagnóstico es requerido |
| 400 | La cita está cancelada o ya fue completada |
| 404 | Cita no encontrada |

---

### GET /medico/patients/:userId

Devuelve el perfil completo de un paciente que haya tenido cita con el médico autenticado.

**Respuesta 200**
```json
{
  "paciente": { ...datosPaciente },
  "historialMedico": [...],
  "medicamentos": [...],
  "citas": [...]
}
```

**Errores**
| Código | Mensaje |
|---|---|
| 403 | No tienes acceso a este paciente |
| 404 | Paciente no encontrado |

---

### GET /medico/renewals

Devuelve las solicitudes de renovación de recetas pendientes para el médico autenticado.

**Respuesta 200** — array de solicitudes con datos del medicamento y del paciente, ordenadas por `created_at` descendente.

---

### PATCH /medico/renewals/:id

Aprueba o rechaza una solicitud de renovación.

**Body**
```json
{ "action": "approve", "nota": "Renovado por 30 días más" }
```
> `action` puede ser `"approve"` o `"reject"`.

**Respuesta 200**
```json
{ "success": true, "renewal": { ...solicitudActualizada } }
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | action debe ser "approve" o "reject" |
| 400 | Esta solicitud ya fue procesada |
| 403 | No tienes permiso para procesar esta solicitud |
| 404 | Solicitud no encontrada |

---

## 9. Panel de Administración (`/api/admin`)

Todos los endpoints requieren autenticación y rol `admin`.

### GET /admin/dashboard

Estadísticas generales del sistema.

**Respuesta 200**
```json
{
  "totalAfiliados": 120,
  "totalMedicos": 8,
  "totalSedes": 4,
  "totalEspecialidades": 10,
  "citasHoy": 25,
  "citasMes": 310,
  "citasPendientes": 12,
  "renovacionesPendientes": 5,
  "autorizacionesPendientes": 3,
  "nuevosAfiliados30d": 18,
  "citasPorEspecialidad": [
    { "name": "Medicina General", "value": 98 }
  ],
  "citasPorMes": [
    { "mes": "Oct", "citas": 45 }
  ]
}
```

---

### GET /admin/users

Lista todos los usuarios con filtros opcionales.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `role` | string | Filtra por rol (`paciente`, `medico`, `admin`) |
| `search` | string | Busca por nombre, cédula o email |
| `activo` | string | `"true"` o `"false"` |

**Respuesta 200** — array de usuarios sin `password_hash`, ordenados por `fecha_registro` descendente.

---

### PATCH /admin/users/:id/toggle-active

Activa o desactiva una cuenta de usuario. No se puede aplicar sobre la propia cuenta del admin.

**Respuesta 200**
```json
{ "success": true, "user": { ...usuarioActualizado } }
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | No puedes desactivar tu propia cuenta |
| 404 | Usuario no encontrado |

---

### PATCH /admin/users/:id/change-role

Cambia el rol de un usuario. No se puede aplicar sobre la propia cuenta del admin.

**Body**
```json
{ "role": "medico", "medicoId": "doc-1" }
```
> `medicoId` es requerido cuando `role` es `"medico"` y debe corresponder a un médico sin cuenta vinculada.

**Respuesta 200**
```json
{ "success": true, "user": { ...usuarioActualizado } }
```

**Errores**
| Código | Mensaje |
|---|---|
| 400 | No puedes cambiar tu propio rol |
| 400 | medicoId es requerido cuando el rol es medico |
| 400 | Este médico ya tiene una cuenta vinculada |
| 404 | Usuario no encontrado |

---

### GET /admin/doctors

Devuelve todos los médicos del sistema.

**Respuesta 200** — array de médicos con especialidad, sedes, experiencia, rating y referencia a cuenta de usuario.

---

### POST /admin/doctors

Crea un nuevo médico y genera disponibilidad por defecto (lunes a viernes).

**Body**
```json
{
  "nombre": "Dr. Nombre Apellido",
  "especialidad_id": "spec-uuid",
  "sedes": ["sede-uuid-1", "sede-uuid-2"],
  "experiencia": 10,
  "rating": 4.8
}
```

**Respuesta 201** — objeto del médico creado.

---

### PUT /admin/doctors/:id

Actualiza los datos de un médico.

**Body** — mismos campos que POST, todos opcionales.

**Respuesta 200** — médico actualizado.

**Errores**
| Código | Mensaje |
|---|---|
| 404 | Médico no encontrado |

---

### DELETE /admin/doctors/:id

Elimina un médico. Bloqueado si tiene citas futuras activas.

**Errores**
| Código | Mensaje |
|---|---|
| 400 | No se puede eliminar: el médico tiene N cita(s) futura(s) activa(s) |
| 404 | Médico no encontrado |

---

### GET /admin/locations

Devuelve todas las sedes.

**Respuesta 200** — array de sedes con dirección, teléfono, horario y coordenadas opcionales.

---

### POST /admin/locations

Crea una nueva sede.

**Body**
```json
{
  "nombre": "Sede Norte",
  "direccion": "Calle 100 #15-20, Bogotá",
  "telefono": "601-123-4567",
  "horario": "Lun-Vie 6:00-20:00",
  "lat": 4.6836,
  "lng": -74.0479
}
```

**Respuesta 201** — objeto de la sede creada.

---

### PUT /admin/locations/:id

Actualiza una sede existente.

**Respuesta 200** — sede actualizada.

**Errores**
| Código | Mensaje |
|---|---|
| 404 | Sede no encontrada |

---

### DELETE /admin/locations/:id

Elimina una sede. Bloqueado si algún médico tiene esa sede asignada.

**Errores**
| Código | Mensaje |
|---|---|
| 400 | No se puede eliminar: N médico(s) tienen esta sede asignada |
| 404 | Sede no encontrada |

---

### GET /admin/specialties

Devuelve todas las especialidades.

**Respuesta 200** — array con `id`, `nombre`, `icono` y `descripcion`.

---

### POST /admin/specialties

Crea una nueva especialidad.

**Body**
```json
{
  "nombre": "Neurología",
  "icono": "Brain",
  "descripcion": "Diagnóstico y tratamiento del sistema nervioso"
}
```

**Respuesta 201** — especialidad creada.

---

### PUT /admin/specialties/:id

Actualiza una especialidad existente.

**Respuesta 200** — especialidad actualizada.

**Errores**
| Código | Mensaje |
|---|---|
| 404 | Especialidad no encontrada |

---

### DELETE /admin/specialties/:id

Elimina una especialidad. Bloqueado si algún médico la tiene asignada.

**Errores**
| Código | Mensaje |
|---|---|
| 400 | No se puede eliminar: N médico(s) tienen esta especialidad asignada |
| 404 | Especialidad no encontrada |
