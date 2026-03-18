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

const TermsPage = () => {
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
            Términos y Condiciones
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
            Última actualización: marzo de 2026 · Versión 1.0
          </p>
        </div>

        <Section title="1. Aceptación de los Términos">
          <P>
            Al acceder y utilizar el Portal del Afiliado EPS (en adelante, "el Portal"), usted acepta quedar vinculado por los presentes Términos y Condiciones de Uso, así como por la Política de Privacidad vigente. Si no está de acuerdo con alguna de estas condiciones, le rogamos que se abstenga de utilizar el Portal.
          </P>
          <P>
            Estos términos aplican a todos los usuarios del Portal, incluyendo afiliados, beneficiarios y profesionales de la salud registrados en el sistema.
          </P>
        </Section>

        <Section title="2. Descripción del Servicio">
          <P>
            El Portal es una plataforma digital que permite a los afiliados de la EPS gestionar servicios de salud de manera electrónica, incluyendo:
          </P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Agendamiento, modificación y cancelación de citas médicas.</Li>
            <Li>Consulta de historial médico y resultados de exámenes.</Li>
            <Li>Seguimiento y control de tratamientos y medicamentos prescritos.</Li>
            <Li>Solicitudes de renovación de recetas médicas.</Li>
            <Li>Comunicación con el equipo médico tratante.</Li>
          </ul>
          <P>
            La EPS se reserva el derecho de modificar, suspender o descontinuar cualquier funcionalidad del Portal en cualquier momento, con o sin previo aviso, sin asumir responsabilidad alguna frente al usuario.
          </P>
        </Section>

        <Section title="3. Registro y Cuenta de Usuario">
          <P>
            Para acceder a las funcionalidades del Portal es necesario crear una cuenta personal. Al registrarse, el usuario se compromete a:
          </P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Proporcionar información veraz, exacta, vigente y completa sobre su identidad.</Li>
            <Li>Mantener y actualizar oportunamente sus datos de contacto.</Li>
            <Li>Mantener la confidencialidad de su contraseña y no compartirla con terceros.</Li>
            <Li>Notificar de inmediato al soporte técnico ante cualquier uso no autorizado de su cuenta.</Li>
            <Li>Ser el único responsable de toda actividad que se realice bajo sus credenciales.</Li>
          </ul>
          <P>
            La EPS podrá suspender o cancelar cuentas que presenten indicios de uso fraudulento, suplantación de identidad o violación de estos términos, sin perjuicio de las acciones legales que correspondan.
          </P>
        </Section>

        <Section title="4. Política de Citas Médicas">
          <P>
            El agendamiento de citas a través del Portal está sujeto a las siguientes condiciones:
          </P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li><strong>Anticipación mínima:</strong> Las citas deben agendarse con al menos 24 horas de antelación respecto al horario solicitado.</Li>
            <Li><strong>Anticipación máxima:</strong> No es posible agendar citas con más de 90 días de anticipación.</Li>
            <Li><strong>Cancelación:</strong> Las cancelaciones deben realizarse con un mínimo de 24 horas de anticipación. La acumulación de inasistencias injustificadas puede resultar en restricciones de acceso al Portal.</Li>
            <Li><strong>Reagendamiento:</strong> Cada cita puede reagendarse hasta dos (2) veces. Superado este límite, la cita será cancelada y deberá crearse una nueva solicitud.</Li>
            <Li><strong>Citas de urgencia:</strong> Las citas para el mismo día deben gestionarse directamente en sede o a través de la línea de atención telefónica.</Li>
          </ul>
          <P>
            El Portal no garantiza disponibilidad de horarios en fechas o especialidades específicas. La disponibilidad depende de la agenda de cada profesional y sede.
          </P>
        </Section>

        <Section title="5. Responsabilidades del Usuario">
          <P>
            El usuario se compromete a utilizar el Portal exclusivamente para los fines establecidos en estos términos y de conformidad con la ley colombiana. Queda expresamente prohibido:
          </P>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Utilizar el Portal para fines distintos a la gestión personal de sus servicios de salud.</Li>
            <Li>Intentar acceder a información de otros usuarios o a sistemas restringidos.</Li>
            <Li>Introducir, difundir o almacenar virus, código malicioso o cualquier programa dañino.</Li>
            <Li>Reproducir, copiar o distribuir el contenido del Portal sin autorización escrita.</Li>
            <Li>Realizar actos que puedan dañar, inutilizar o sobrecargar la infraestructura del Portal.</Li>
          </ul>
        </Section>

        <Section title="6. Limitación de Responsabilidad">
          <P>
            El Portal es una herramienta de gestión administrativa y no constituye, en ningún caso, un servicio de atención médica de urgencias ni reemplaza la consulta presencial con un profesional de la salud.
          </P>
          <P>
            La EPS no será responsable por daños directos, indirectos, incidentales o consecuentes derivados de: interrupciones en el servicio por mantenimiento o causas de fuerza mayor; errores tipográficos en la información publicada; decisiones tomadas por el usuario basándose exclusivamente en la información del Portal; ni por fallos en la conectividad a internet del usuario.
          </P>
          <P>
            En ningún caso la responsabilidad total de la EPS frente al usuario por cualquier reclamación relacionada con el Portal excederá el valor de los servicios efectivamente pagados por el usuario durante los doce (12) meses anteriores al evento que originó la reclamación.
          </P>
        </Section>

        <Section title="7. Propiedad Intelectual">
          <P>
            Todos los contenidos del Portal, incluyendo pero no limitado a textos, gráficos, logotipos, íconos, imágenes, clips de audio y software, son propiedad exclusiva de la EPS o de sus proveedores de contenido y están protegidos por las leyes colombianas e internacionales de propiedad intelectual.
          </P>
          <P>
            Se concede al usuario una licencia limitada, no exclusiva, no transferible y revocable para acceder y utilizar el Portal únicamente para los fines descritos en estos términos. Ninguna disposición de estos términos transfiere al usuario derecho, título o interés alguno sobre la propiedad intelectual de la EPS.
          </P>
        </Section>

        <Section title="8. Modificaciones a los Términos">
          <P>
            La EPS se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios entrarán en vigor a partir de su publicación en el Portal. El uso continuado del Portal después de la publicación de modificaciones constituye la aceptación de los nuevos términos. Se recomienda revisar periódicamente esta página.
          </P>
        </Section>

        <Section title="9. Ley Aplicable y Jurisdicción">
          <P>
            Los presentes Términos y Condiciones se rigen e interpretan de conformidad con las leyes de la República de Colombia, en particular la Ley 527 de 1999 (Comercio Electrónico), la Ley 1480 de 2011 (Estatuto del Consumidor), la Ley 1581 de 2012 (Protección de Datos Personales) y demás normas concordantes.
          </P>
          <P>
            Para la resolución de cualquier controversia derivada de estos términos, las partes se someten a los jueces y tribunales competentes de la ciudad de Bogotá D.C., Colombia, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.
          </P>
        </Section>

        <Section title="10. Contacto">
          <P>
            Para consultas, reclamaciones o ejercicio de derechos relacionados con estos Términos, puede comunicarse a través de los siguientes canales:
          </P>
          <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: '0.75rem' }}>
            <Li>📧 <strong>Correo:</strong> legal@eps.com.co</Li>
            <Li>📞 <strong>Línea de atención:</strong> 01 8000 123 456</Li>
            <Li>📍 <strong>Dirección:</strong> Carrera 7 #74-56, Bogotá D.C., Colombia</Li>
          </ul>
        </Section>

        {/* Footer note */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '1.5rem', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', textAlign: 'center' }}>
            © 2026 EPS Portal del Afiliado · Todos los derechos reservados ·{' '}
            <Link to="/privacidad" style={{ color: '#7C3AED', textDecoration: 'none' }}>Política de Privacidad</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
