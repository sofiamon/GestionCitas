import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const C_PURPLE     = [124, 58, 237];   // #7C3AED
const C_CYAN       = [6, 182, 212];    // #06B6D4
const C_DARK       = [30, 41, 59];     // #1e293b
const C_MID        = [100, 116, 139];  // #64748b
const C_LIGHT      = [148, 163, 184];  // #94a3b8
const C_BORDER     = [226, 232, 240];  // #e2e8f0
const C_PURPLE_BG  = [245, 243, 255];  // #F5F3FF

// ─── Layout constants ─────────────────────────────────────────────────────────

const PAGE_W  = 215.9;  // letter mm
const PAGE_H  = 279.4;
const MARGIN  = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H  = 26;
const FOOTER_Y  = PAGE_H - 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
};

const fmtNow = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const simpleHash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(16).toUpperCase().padStart(8, '0');
};

// ─── Per-page chrome ──────────────────────────────────────────────────────────

const drawHeader = (doc) => {
  // Main purple band
  doc.setFillColor(...C_PURPLE);
  doc.rect(0, 0, PAGE_W, HEADER_H, 'F');

  // Cyan accent strip (right edge — simulates gradient)
  doc.setFillColor(...C_CYAN);
  doc.rect(PAGE_W - 55, 0, 55, HEADER_H, 'F');

  // White fade overlay strip (blends the two bands)
  doc.setFillColor(255, 255, 255);
  doc.setGState && doc.setGState(doc.GState({ opacity: 0.08 }));
  doc.rect(PAGE_W - 80, 0, 30, HEADER_H, 'F');
  try { doc.setGState(doc.GState({ opacity: 1 })); } catch (_) {}

  // 'EPS' wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('EPS', MARGIN, 10.5);

  // Subtext
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Portal del Afiliado', MARGIN, 18);
};

const drawFooter = (doc, page, total, generatedAt) => {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C_LIGHT);

  doc.text(
    'Documento generado automáticamente por EPS Portal del Afiliado',
    PAGE_W / 2, FOOTER_Y - 4,
    { align: 'center' },
  );
  doc.text(`Generado el: ${generatedAt}`, MARGIN, FOOTER_Y);
  doc.text(`Página ${page} de ${total}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' });
};

const stampAllPages = (doc, generatedAt) => {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawHeader(doc);
    drawFooter(doc, p, total, generatedAt);
  }
};

// ─── autoTable default styles ─────────────────────────────────────────────────

const tableDefaults = (startY, didAddPage) => ({
  startY,
  margin: { left: MARGIN, right: MARGIN, top: HEADER_H + 4, bottom: 18 },
  styles: {
    fontSize: 9,
    cellPadding: 3.5,
    lineColor: C_BORDER,
    lineWidth: 0.2,
    textColor: C_DARK,
    font: 'helvetica',
  },
  headStyles: {
    fillColor: C_PURPLE,
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 9,
  },
  alternateRowStyles: { fillColor: C_PURPLE_BG },
  didAddPage: didAddPage || null,
});

// ─── createPDFBase ────────────────────────────────────────────────────────────

export const createPDFBase = (title) => {
  const doc = new jsPDF({ format: 'letter', unit: 'mm', orientation: 'portrait' });
  const generatedAt = fmtNow();

  drawHeader(doc);

  // Title block
  const titleY = HEADER_H + 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...C_DARK);
  doc.text(title, PAGE_W / 2, titleY, { align: 'center' });

  // Separator
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, titleY + 5, PAGE_W - MARGIN, titleY + 5);

  return { doc, yPos: titleY + 11, generatedAt };
};

// ─── generateAffiliationCertificate ──────────────────────────────────────────

export const generateAffiliationCertificate = (user) => {
  const { doc, yPos, generatedAt } = createPDFBase('CERTIFICADO DE AFILIACIÓN');

  const redrawOnPage = () => { drawHeader(doc); };

  // Formal paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...C_MID);

  const texto = `La Entidad Promotora de Salud certifica que el/la señor(a) ${user.nombreCompleto || `${user.nombre || ''} ${user.apellido || ''}`.trim()}, identificado(a) con cédula de ciudadanía número ${user.cedula}, se encuentra afiliado(a) al Sistema General de Seguridad Social en Salud desde el ${fmtDate(user.fecha_registro)}.`;

  const lines = doc.splitTextToSize(texto, CONTENT_W);
  doc.text(lines, MARGIN, yPos);

  const afterText = yPos + lines.length * 5 + 6;

  // Data table
  autoTable(doc, {
    ...tableDefaults(afterText, redrawOnPage),
    head: [['Campo', 'Valor']],
    body: [
      ['Nombre completo', user.nombreCompleto || `${user.nombre || ''} ${user.apellido || ''}`.trim()],
      ['Cédula de ciudadanía', user.cedula || '—'],
      ['Correo electrónico', user.email || '—'],
      ['Celular', user.celular || '—'],
      ['Departamento', user.departamento || '—'],
      ['Municipio', user.municipio || '—'],
      ['Dirección', user.direccion || '—'],
      ['Fecha de registro', fmtDate(user.fecha_registro)],
      ['Estado', user.activo ? 'Activo' : 'Inactivo'],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, fillColor: C_PURPLE_BG },
      1: { cellWidth: CONTENT_W - 55 },
    },
  });

  // Legal note
  const noteY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...C_MID);
  doc.text(
    'Este certificado se expide a solicitud del interesado para los fines que estime convenientes.',
    MARGIN, noteY,
  );

  // Verification code
  const code = simpleHash(`${user.id || user.cedula}-${generatedAt}`);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C_LIGHT);
  doc.text(`Código de verificación: ${code}`, MARGIN, noteY + 6);

  stampAllPages(doc, generatedAt);
  doc.save(`certificado_afiliacion_${user.cedula}.pdf`);
};

// ─── generateMedicalHistoryPDF ────────────────────────────────────────────────

export const generateMedicalHistoryPDF = (user, history) => {
  const { doc, yPos, generatedAt } = createPDFBase('HISTORIAL MÉDICO');

  const redrawOnPage = () => { drawHeader(doc); };

  // Patient summary table
  autoTable(doc, {
    ...tableDefaults(yPos, redrawOnPage),
    head: [['Paciente', 'Cédula', 'Fecha de nacimiento']],
    body: [[
      user.nombreCompleto || `${user.nombre || ''} ${user.apellido || ''}`.trim(),
      user.cedula || '—',
      fmtDate(user.fecha_nacimiento),
    ]],
  });

  let curY = doc.lastAutoTable.finalY + 8;

  if (!history || history.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...C_MID);
    doc.text('Sin registros en el historial médico.', MARGIN, curY);
    stampAllPages(doc, generatedAt);
    doc.save(`historial_medico_${user.cedula}.pdf`);
    return;
  }

  history.forEach((record, idx) => {
    // Page break check
    if (curY > PAGE_H - 60) {
      doc.addPage();
      drawHeader(doc);
      curY = HEADER_H + 8;
    }

    // Entry header bar
    doc.setFillColor(...C_PURPLE_BG);
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, curY, CONTENT_W, 8, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C_PURPLE);
    doc.text(`${idx + 1}.  ${fmtDate(record.fecha)}  ·  ${record.especialidad}`, MARGIN + 3, curY + 5.5);

    curY += 11;

    // Entry detail table
    autoTable(doc, {
      ...tableDefaults(curY, redrawOnPage),
      head: [['Médico', 'Sede', 'Diagnóstico']],
      body: [[record.medico || '—', record.sede || '—', record.diagnostico || '—']],
      margin: { left: MARGIN, right: MARGIN, top: HEADER_H + 4, bottom: 18 },
    });

    curY = doc.lastAutoTable.finalY + 3;

    // Notes
    if (record.notas) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...C_MID);
      const noteLines = doc.splitTextToSize(`Notas: ${record.notas}`, CONTENT_W);
      if (curY + noteLines.length * 4.5 > PAGE_H - 25) {
        doc.addPage(); drawHeader(doc); curY = HEADER_H + 8;
      }
      doc.text(noteLines, MARGIN, curY);
      curY += noteLines.length * 4.5 + 2;
    }

    // Prescriptions
    if (record.recetas && record.recetas.length > 0) {
      if (curY + record.recetas.length * 4.5 + 8 > PAGE_H - 25) {
        doc.addPage(); drawHeader(doc); curY = HEADER_H + 8;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...C_DARK);
      doc.text('Recetas:', MARGIN, curY);
      curY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C_MID);
      record.recetas.forEach(r => {
        doc.text(`• ${r}`, MARGIN + 3, curY);
        curY += 4.5;
      });
      curY += 1;
    }

    // Exams
    if (record.examenes && record.examenes.length > 0) {
      if (curY + record.examenes.length * 4.5 + 8 > PAGE_H - 25) {
        doc.addPage(); drawHeader(doc); curY = HEADER_H + 8;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...C_DARK);
      doc.text('Exámenes:', MARGIN, curY);
      curY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C_MID);
      record.examenes.forEach(e => {
        doc.text(`• ${e}`, MARGIN + 3, curY);
        curY += 4.5;
      });
      curY += 1;
    }

    // Separator between entries
    if (idx < history.length - 1) {
      doc.setDrawColor(...C_BORDER);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, curY + 2, PAGE_W - MARGIN, curY + 2);
      curY += 8;
    }
  });

  stampAllPages(doc, generatedAt);
  doc.save(`historial_medico_${user.cedula}.pdf`);
};

// ─── generateAuthorizationPDF ─────────────────────────────────────────────────

export const generateAuthorizationPDF = (user, authorization) => {
  const { doc, yPos, generatedAt } = createPDFBase('AUTORIZACIÓN MÉDICA');

  const redrawOnPage = () => { drawHeader(doc); };

  // Highlighted code block
  doc.setFillColor(240, 253, 244);        // light green bg
  doc.setDrawColor(134, 239, 172);        // green border
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, yPos, CONTENT_W, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);          // dark green
  doc.text('CÓDIGO DE AUTORIZACIÓN', PAGE_W / 2, yPos + 5.5, { align: 'center' });

  doc.setFontSize(15);
  doc.text(authorization.codigo_autorizacion || '—', PAGE_W / 2, yPos + 14, { align: 'center' });

  const afterCode = yPos + 22;

  // Authorization detail table
  const TIPO_LABELS = {
    examen: 'Examen de laboratorio', procedimiento: 'Procedimiento',
    consulta_especialista: 'Consulta con especialista',
    imagen: 'Imagen diagnóstica', cirugia: 'Cirugía',
  };
  const PRIORIDAD_LABELS = { urgente: 'Urgente', prioritario: 'Prioritario', normal: 'Normal' };

  autoTable(doc, {
    ...tableDefaults(afterCode, redrawOnPage),
    head: [['Detalle', 'Valor']],
    body: [
      ['Tipo de servicio',       TIPO_LABELS[authorization.tipo] || authorization.tipo || '—'],
      ['Descripción',            authorization.descripcion || '—'],
      ['Diagnóstico relacionado',authorization.diagnostico_relacionado || '—'],
      ['Prioridad',              PRIORIDAD_LABELS[authorization.prioridad] || authorization.prioridad || '—'],
      ['Médico solicitante',     authorization.medico_nombre || '—'],
      ['Sede',                   authorization.sede_nombre || '—'],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, fillColor: C_PURPLE_BG },
      1: { cellWidth: CONTENT_W - 55 },
    },
  });

  let curY = doc.lastAutoTable.finalY + 5;

  // Patient & dates table
  autoTable(doc, {
    ...tableDefaults(curY, redrawOnPage),
    head: [['Paciente', 'Cédula', 'Solicitud', 'Aprobación', 'Vencimiento']],
    body: [[
      user.nombreCompleto || `${user.nombre || ''} ${user.apellido || ''}`.trim(),
      user.cedula || '—',
      fmtDate(authorization.fecha_solicitud),
      fmtDate(authorization.fecha_respuesta),
      fmtDate(authorization.fecha_vencimiento),
    ]],
  });

  curY = doc.lastAutoTable.finalY + 6;

  // Doctor notes
  if (authorization.notas_medico) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C_DARK);
    doc.text('Notas del médico:', MARGIN, curY);
    curY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C_MID);
    const noteLines = doc.splitTextToSize(authorization.notas_medico, CONTENT_W);
    doc.text(noteLines, MARGIN, curY);
    curY += noteLines.length * 4.5 + 4;
  }

  // Authorization notes
  if (authorization.notas_autorizacion) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C_DARK);
    doc.text('Notas de autorización:', MARGIN, curY);
    curY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C_MID);
    const authNoteLines = doc.splitTextToSize(authorization.notas_autorizacion, CONTENT_W);
    doc.text(authNoteLines, MARGIN, curY);
    curY += authNoteLines.length * 4.5 + 6;
  }

  // Legal notice
  doc.setFillColor(255, 251, 235);    // amber-50
  doc.setDrawColor(253, 230, 138);    // amber-200
  doc.setLineWidth(0.3);
  const noticeText = `Esta autorización es válida hasta el ${fmtDate(authorization.fecha_vencimiento)}. Presente este documento en la sede indicada.`;
  const noticeLines = doc.splitTextToSize(noticeText, CONTENT_W - 8);
  doc.roundedRect(MARGIN, curY, CONTENT_W, noticeLines.length * 4.5 + 8, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);      // amber-800
  doc.text(noticeLines, MARGIN + 4, curY + 6);

  stampAllPages(doc, generatedAt);
  doc.save(`autorizacion_${authorization.codigo_autorizacion || 'doc'}.pdf`);
};

// ─── generateAllAuthorizationsPDF ────────────────────────────────────────────

export const generateAllAuthorizationsPDF = (user, authorizations) => {
  const { doc, yPos, generatedAt } = createPDFBase('AUTORIZACIONES MÉDICAS APROBADAS');

  const redrawOnPage = () => { drawHeader(doc); };

  const TIPO_LABELS = {
    examen: 'Examen', procedimiento: 'Procedimiento',
    consulta_especialista: 'Consulta Especialista',
    imagen: 'Imagen Diagnóstica', cirugia: 'Cirugía',
  };

  // Patient header
  autoTable(doc, {
    ...tableDefaults(yPos, redrawOnPage),
    head: [['Paciente', 'Cédula']],
    body: [[
      user.nombreCompleto || `${user.nombre || ''} ${user.apellido || ''}`.trim(),
      user.cedula || '—',
    ]],
  });

  let curY = doc.lastAutoTable.finalY + 8;

  if (!authorizations || authorizations.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...C_MID);
    doc.text('No tienes autorizaciones aprobadas vigentes.', MARGIN, curY);
    stampAllPages(doc, generatedAt);
    doc.save(`autorizaciones_aprobadas_${user.cedula}.pdf`);
    return;
  }

  // Summary table with all authorizations
  autoTable(doc, {
    ...tableDefaults(curY, redrawOnPage),
    head: [['Código', 'Tipo', 'Descripción', 'Médico', 'Vencimiento']],
    body: authorizations.map(a => [
      a.codigo_autorizacion || '—',
      TIPO_LABELS[a.tipo] || a.tipo || '—',
      a.descripcion || '—',
      a.medico_nombre || '—',
      fmtDate(a.fecha_vencimiento),
    ]),
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 36 },
      1: { cellWidth: 32 },
      2: { cellWidth: 60 },
      3: { cellWidth: 40 },
      4: { cellWidth: CONTENT_W - 168 },
    },
  });

  curY = doc.lastAutoTable.finalY + 10;

  // Individual detail blocks
  authorizations.forEach((auth, idx) => {
    if (curY > PAGE_H - 55) {
      doc.addPage(); drawHeader(doc); curY = HEADER_H + 8;
    }

    // Section header bar
    doc.setFillColor(...C_PURPLE_BG);
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, curY, CONTENT_W, 8, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C_PURPLE);
    doc.text(
      `${idx + 1}.  ${auth.codigo_autorizacion || '—'}  ·  ${TIPO_LABELS[auth.tipo] || auth.tipo}`,
      MARGIN + 3, curY + 5.5,
    );
    curY += 11;

    autoTable(doc, {
      ...tableDefaults(curY, redrawOnPage),
      head: [['Descripción', 'Médico', 'Sede', 'Aprobación', 'Vencimiento']],
      body: [[
        auth.descripcion || '—',
        auth.medico_nombre || '—',
        auth.sede_nombre || '—',
        fmtDate(auth.fecha_respuesta),
        fmtDate(auth.fecha_vencimiento),
      ]],
    });

    curY = doc.lastAutoTable.finalY + 6;

    if (idx < authorizations.length - 1) {
      doc.setDrawColor(...C_BORDER);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, curY, PAGE_W - MARGIN, curY);
      curY += 6;
    }
  });

  stampAllPages(doc, generatedAt);
  doc.save(`autorizaciones_aprobadas_${user.cedula}.pdf`);
};

// ─── generateAppointmentConfirmation ─────────────────────────────────────────

export const generateAppointmentConfirmation = (user, appointment) => {
  const { doc, yPos, generatedAt } = createPDFBase('COMPROBANTE DE CITA MÉDICA');

  const redrawOnPage = () => { drawHeader(doc); };

  const STATE_LABELS = {
    confirmada: 'Confirmada', pendiente: 'Pendiente',
    completada: 'Completada', cancelada: 'Cancelada',
  };

  // Appointment details table
  autoTable(doc, {
    ...tableDefaults(yPos, redrawOnPage),
    head: [['Campo', 'Detalle']],
    body: [
      ['Especialidad',  appointment.especialidad_nombre || appointment.especialidad || '—'],
      ['Médico',        appointment.medico || '—'],
      ['Sede',          appointment.sede || '—'],
      ['Fecha',         fmtDate(appointment.fecha)],
      ['Hora',          appointment.hora || '—'],
      ['Estado',        STATE_LABELS[appointment.estado] || appointment.estado || '—'],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, fillColor: C_PURPLE_BG },
      1: { cellWidth: CONTENT_W - 45 },
    },
  });

  let curY = doc.lastAutoTable.finalY + 5;

  // Patient table
  autoTable(doc, {
    ...tableDefaults(curY, redrawOnPage),
    head: [['Paciente', 'Cédula', 'Email', 'Celular']],
    body: [[
      user.nombreCompleto || `${user.nombre || ''} ${user.apellido || ''}`.trim(),
      user.cedula || '—',
      user.email || '—',
      user.celular || '—',
    ]],
  });

  curY = doc.lastAutoTable.finalY + 8;

  // Reminder box
  const reminder = 'Recuerde llegar 15 minutos antes de su cita. Cancele con al menos 24 horas de anticipación si no puede asistir.';
  const remLines = doc.splitTextToSize(reminder, CONTENT_W - 8);
  doc.setFillColor(245, 243, 255);    // purple-50
  doc.setDrawColor(196, 181, 253);    // purple-200
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, curY, CONTENT_W, remLines.length * 4.5 + 8, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(109, 40, 217);     // purple-700
  doc.text(remLines, MARGIN + 4, curY + 6);

  stampAllPages(doc, generatedAt);

  const dateTag = appointment.fecha ? appointment.fecha.replace(/-/g, '') : 'fecha';
  const timeTag = appointment.hora ? appointment.hora.replace(':', '') : 'hora';
  doc.save(`cita_${dateTag}_${timeTag}.pdf`);
};
