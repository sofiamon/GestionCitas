import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #F3F4F6' }}>
      {title}
    </h2>
    <div style={{ color: '#374151', lineHeight: 1.8, fontSize: '0.9375rem' }}>
      {children}
    </div>
  </section>
);

const P = ({ children }) => (
  <p style={{ marginBottom: '0.75rem' }}>{children}</p>
);

const Li = ({ children }) => (
  <li style={{ marginBottom: '0.35rem', paddingLeft: '0.25rem' }}>{children}</li>
);

const Tag = ({ children }) => (
  <span style={{ display: 'inline-block', backgroundColor: '#F5F3FF', color: '#7C3AED', fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.625rem', borderRadius: '9999px', marginRight: '0.375rem', marginBottom: '0.375rem' }}>
    {children}
  </span>
);

const PrivacyPage = () => {
  // Always light mode — independent of portal theme
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.remove('dark');
    return () => { if (hadDark) html.classList.add('dark'); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Navbar */}
      <header style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="gradient-primary" style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartPulse size={14} color="#ffffff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>EPS Portal</span>
          </div>
          <Link
            to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: '#6B7280', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#7C3AED'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; }}
          >
            <ArrowLeft size={15} />
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
            Documento legal
          </p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            Política de Privacidad
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '1rem' }}>
            Última actualización: marzo de 2026 · Versión 1.0
          </p>
          <div style={{ backgroundColor: '#F5F3FF', border: '1px solid #EDE9FE', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6D28D9', lineHeight: 1.7, margin: 0 }}>
              Esta Política de Privacidad está diseñada de conformidad con la{' '}
              <strong>Ley 1581 de 2012</strong> (Régimen General de Protección de Datos Personales de Colombia),
              el <strong>Decreto 1377 de 2013</strong> y demás normas reglamentarias vigentes.
            </p>
          </div>
        </div>

        <Section title="1. Responsable del Tratamiento">
          <P>
            El responsable del tratamiento de sus datos personales es la <strong>EPS Portal del Afiliado</strong>,
            con domicilio principal en Carrera 7 #74-56, Bogotá D.C., Colombia.
            Para ejercer sus derechos o realizar cualquier consulta sobre el tratamiento de sus datos,
            puede contactarnos en <strong>privacidad@eps.com.co</strong>.
          </P>
        </Section>

        <Section title="2. Datos que Recopilamos">
          <P>Recopilamos y tratamos las siguientes categorías de datos personales:</P>

          <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.375rem', marginTop: '1rem' }}>Datos de identificación y contacto</p>
          <div style={{ marginBottom: '0.75rem' }}>
            <Tag>Nombre completo</Tag><Tag>Número de cédula</Tag><Tag>Fecha de nacimiento</Tag>
            <Tag>Correo electrónico</Tag><Tag>Número de celular</Tag><Tag>Dirección</Tag>
          </div>

          <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.375rem' }}>Datos de salud (datos sensibles)</p>
          <div style={{ marginBottom: '0.75rem' }}>
            <Tag>Historial de consultas médicas</Tag><Tag>Diagnósticos</Tag><Tag>Prescripciones</Tag>
            <Tag>Resultados de exámenes</Tag><Tag>Medicamentos activos</Tag><Tag>Notas médicas</Tag>
          </div>

          <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.375rem' }}>Datos de uso del Portal</p>
          <div style={{ marginBottom: '0.75rem' }}>
            <Tag>Dirección IP</Tag><Tag>Tipo de dispositivo</Tag><Tag>Registros de acceso</Tag>
            <Tag>Citas agendadas</Tag><Tag>Preferencias del portal</Tag>
          </div>

          <P>
            Los datos de salud son considerados <strong>datos sensibles</strong> conforme al artículo 5 de la Ley 1581 de 2012
            y reciben un nivel de protección reforzado. Su tratamiento requiere autorización expresa del titular
            y se limita estrictamente a la prestación del servicio de salud.
          </P>
        </Section>

        <Section title="3. Finalidades del Tratamiento">
          <P>Sus datos personales son tratados para las siguientes finalidades:</P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Gestión del registro y autenticación de usuarios en el Portal.</Li>
            <Li>Agendamiento, modificación y cancelación de citas médicas.</Li>
            <Li>Prestación de los servicios de salud contratados con la EPS.</Li>
            <Li>Comunicación de confirmaciones, recordatorios y notificaciones relacionadas con su atención.</Li>
            <Li>Elaboración y consulta del historial médico por parte de los profesionales autorizados.</Li>
            <Li>Control y seguimiento de tratamientos farmacológicos.</Li>
            <Li>Cumplimiento de obligaciones legales y regulatorias ante entidades de salud (Ministerio de Salud, Supersalud).</Li>
            <Li>Mejora continua de la plataforma y análisis estadísticos en forma anonimizada.</Li>
            <Li>Envío de comunicaciones informativas sobre cambios en el Portal o en los servicios, previa aceptación.</Li>
          </ul>
        </Section>

        <Section title="4. Base Legal para el Tratamiento">
          <P>
            El tratamiento de sus datos se sustenta en las siguientes bases legales previstas en la Ley 1581 de 2012:
          </P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li><strong>Autorización del titular:</strong> obtenida en el momento del registro en el Portal.</Li>
            <Li><strong>Ejecución contractual:</strong> necesario para la prestación de los servicios de salud.</Li>
            <Li><strong>Obligación legal:</strong> para el cumplimiento de normativas del sector salud en Colombia.</Li>
            <Li><strong>Interés legítimo:</strong> para la seguridad del Portal y la prevención del fraude.</Li>
          </ul>
        </Section>

        <Section title="5. Compartición de Datos con Terceros">
          <P>
            Sus datos personales podrán ser compartidos únicamente con las siguientes categorías de destinatarios,
            quienes están obligados contractualmente a mantener la confidencialidad y a tratar los datos
            conforme a la ley colombiana:
          </P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li><strong>Profesionales de la salud:</strong> médicos y especialistas adscritos a la EPS que tienen relación de atención con usted.</Li>
            <Li><strong>Entidades del Sistema de Seguridad Social:</strong> ADRES, Ministerio de Salud y Protección Social, Superintendencia Nacional de Salud, cuando exista obligación legal de reporte.</Li>
            <Li><strong>Laboratorios y clínicas aliadas:</strong> para la gestión de exámenes diagnósticos y procedimientos derivados.</Li>
            <Li><strong>Proveedores tecnológicos:</strong> empresas que prestan servicios de hosting, seguridad y mantenimiento del Portal, bajo estrictos acuerdos de confidencialidad.</Li>
          </ul>
          <P>
            <strong>No vendemos, alquilamos ni comercializamos sus datos personales a terceros con fines publicitarios o de mercadeo.</strong>
          </P>
        </Section>

        <Section title="6. Seguridad de los Datos">
          <P>
            Implementamos medidas técnicas, administrativas y físicas orientadas a proteger sus datos contra
            acceso no autorizado, alteración, divulgación o destrucción. Entre las medidas aplicadas se incluyen:
          </P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Cifrado de datos en tránsito mediante protocolo TLS/HTTPS.</Li>
            <Li>Autenticación mediante tokens JWT con expiración automática.</Li>
            <Li>Control de acceso basado en roles (paciente / médico).</Li>
            <Li>Sesiones con cierre automático por inactividad (30 minutos).</Li>
            <Li>Registro de auditoría de accesos y modificaciones sensibles.</Li>
            <Li>Copias de seguridad periódicas y cifradas.</Li>
            <Li>Evaluaciones de seguridad y pruebas de vulnerabilidad regulares.</Li>
          </ul>
          <P>
            Ante un incidente de seguridad que pueda afectar sus datos, la EPS notificará a los titulares
            afectados y a la Superintendencia de Industria y Comercio en los plazos establecidos por la ley.
          </P>
        </Section>

        <Section title="7. Conservación de los Datos">
          <P>
            Sus datos personales serán conservados durante el tiempo necesario para cumplir con las
            finalidades descritas en esta política y durante los plazos legales obligatorios:
          </P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li><strong>Datos de salud:</strong> mínimo 15 años conforme a la normativa de historia clínica (Resolución 1995 de 1999).</Li>
            <Li><strong>Datos de cuenta:</strong> mientras la cuenta esté activa y hasta 5 años después de su cancelación.</Li>
            <Li><strong>Registros de auditoría:</strong> mínimo 5 años.</Li>
            <Li><strong>Datos de uso anónimos:</strong> indefinidamente en forma agregada.</Li>
          </ul>
        </Section>

        <Section title="8. Derechos del Titular">
          <P>
            De conformidad con el artículo 8 de la Ley 1581 de 2012, usted como titular de los datos tiene los siguientes derechos:
          </P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li><strong>Acceso:</strong> conocer, actualizar y rectificar sus datos personales en cualquier momento.</Li>
            <Li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos, incompletos o desactualizados.</Li>
            <Li><strong>Supresión:</strong> solicitar la eliminación de sus datos cuando no sean necesarios para las finalidades autorizadas, salvo que exista obligación legal de conservarlos.</Li>
            <Li><strong>Revocación:</strong> revocar la autorización otorgada para el tratamiento de sus datos.</Li>
            <Li><strong>Oposición:</strong> oponerse al tratamiento de sus datos para finalidades específicas.</Li>
            <Li><strong>Portabilidad:</strong> recibir sus datos en un formato estructurado y de uso común.</Li>
            <Li><strong>Queja:</strong> presentar quejas ante la Superintendencia de Industria y Comercio cuando considere que sus derechos han sido vulnerados.</Li>
          </ul>
          <P>
            Para ejercer cualquiera de estos derechos, puede actualizar directamente sus datos en la sección
            "Mi Perfil" del Portal, o enviando una solicitud escrita a <strong>privacidad@eps.com.co</strong>.
            Responderemos a su solicitud en un plazo máximo de diez (10) días hábiles.
          </P>
        </Section>

        <Section title="9. Cookies y Tecnologías de Seguimiento">
          <P>
            El Portal utiliza almacenamiento local del navegador (localStorage) para mantener su sesión activa
            y guardar preferencias de uso. No utilizamos cookies de seguimiento publicitario ni compartimos
            datos de navegación con redes de publicidad.
          </P>
          <P>
            Puede limpiar los datos de almacenamiento local desde la configuración de su navegador en cualquier
            momento, lo que cerrará su sesión activa en el Portal.
          </P>
        </Section>

        <Section title="10. Menores de Edad">
          <P>
            El Portal no está dirigido a menores de 18 años de forma autónoma. El registro de menores como
            beneficiarios debe realizarse a través del titular del plan de salud, quien asume la responsabilidad
            sobre los datos del menor. Si detectamos que hemos recopilado datos de un menor sin autorización,
            procederemos a eliminarlos de inmediato.
          </P>
        </Section>

        <Section title="11. Cambios en esta Política">
          <P>
            La EPS podrá actualizar esta Política de Privacidad periódicamente para reflejar cambios en
            nuestras prácticas, en los servicios ofrecidos o en la legislación aplicable. Las modificaciones
            entrarán en vigor en la fecha de su publicación en el Portal. Le notificaremos cambios materiales
            a través del correo electrónico registrado en su cuenta.
          </P>
        </Section>

        <Section title="12. Contacto y Ejercicio de Derechos">
          <P>Para consultas, solicitudes o reclamaciones relacionadas con el tratamiento de sus datos:</P>
          <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: '0.75rem' }}>
            <Li>📧 <strong>Correo Oficial de Privacidad:</strong> privacidad@eps.com.co</Li>
            <Li>📞 <strong>Línea de Atención:</strong> 01 8000 123 456 (Lun–Vie 7:00–19:00)</Li>
            <Li>📍 <strong>Dirección Física:</strong> Carrera 7 #74-56, Bogotá D.C., Colombia</Li>
            <Li>🏛️ <strong>Entidad de Control:</strong> Superintendencia de Industria y Comercio — <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" style={{ color: '#7C3AED' }}>www.sic.gov.co</a></Li>
          </ul>
        </Section>

        {/* Footer note */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '1.5rem', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', textAlign: 'center' }}>
            © 2026 EPS Portal del Afiliado · Todos los derechos reservados ·{' '}
            <Link to="/terminos" style={{ color: '#7C3AED', textDecoration: 'none' }}>Términos y Condiciones</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
