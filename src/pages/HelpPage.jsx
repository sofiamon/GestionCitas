import React, { useState } from 'react';
import {
  HelpCircle, ChevronDown, ChevronUp, Phone, Mail,
  MessageCircle, Calendar, Pill, FileText, User, Shield, RefreshCw
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

const pacienteFaqs = [
  {
    category: 'Citas',
    icon: Calendar,
    color: 'text-primary-500',
    bg: 'bg-primary-50',
    items: [
      {
        question: '¿Cómo agendo una cita médica?',
        answer: 'Ve a "Agendar Cita" en el menú lateral o en el dashboard. Selecciona la especialidad, médico, sede y el horario de tu preferencia. Confirma los datos y acepta las condiciones para completar el agendamiento.',
      },
      {
        question: '¿Con cuánta anticipación puedo agendar una cita?',
        answer: 'Puedes agendar citas desde 24 horas hasta 90 días en adelante. Las citas para el mismo día no están disponibles a través del portal; para esos casos, comunícate directamente con tu sede.',
      },
      {
        question: '¿Puedo cancelar o reagendar mi cita?',
        answer: 'Sí. En "Mis Citas" puedes cancelar o reagendar citas confirmadas o pendientes. Las cancelaciones deben hacerse con al menos 24 horas de anticipación. Cada cita puede reagendarse hasta 2 veces.',
      },
      {
        question: '¿Qué hago si no puedo asistir a mi cita?',
        answer: 'Cancela la cita desde el portal con anticipación. Esto libera el espacio para otros afiliados y evita penalizaciones en tu historial.',
      },
    ],
  },
  {
    category: 'Medicamentos',
    icon: Pill,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    items: [
      {
        question: '¿Cómo registro que tomé un medicamento?',
        answer: 'En la sección "Medicamentos" encontrarás el listado de tus medicamentos activos con sus horarios. Presiona "Marcar tomado" junto al horario correspondiente para registrar la dosis.',
      },
      {
        question: '¿Cómo solicito la renovación de una receta?',
        answer: 'Cuando te queden 7 días o menos de medicamento, aparecerá el botón "Solicitar Renovación" en la tarjeta del medicamento. La solicitud se envía automáticamente al médico tratante para su aprobación.',
      },
    ],
  },
  {
    category: 'Historial Médico',
    icon: FileText,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    items: [
      {
        question: '¿Qué información encuentro en el historial médico?',
        answer: 'El historial incluye todas tus consultas anteriores con diagnóstico, notas del médico, recetas emitidas y exámenes ordenados. Haz clic en cada registro para ver los detalles completos.',
      },
      {
        question: '¿El historial médico es privado?',
        answer: 'Sí. Tu historial médico es completamente privado y solo puedes acceder a él tú. La información está protegida bajo estrictas políticas de seguridad y privacidad de datos.',
      },
    ],
  },
  {
    category: 'Mi Perfil',
    icon: User,
    color: 'text-secondary-500',
    bg: 'bg-secondary-50',
    items: [
      {
        question: '¿Puedo actualizar mis datos de contacto?',
        answer: 'Sí. En "Mi Perfil" puedes actualizar tu nombre, número de celular, correo electrónico y dirección. La cédula y la fecha de nacimiento no son editables por ser datos de identificación.',
      },
      {
        question: '¿Cómo cambio mi contraseña?',
        answer: 'En "Mi Perfil", en la sección de Seguridad, haz clic en "Cambiar Contraseña". Deberás ingresar tu contraseña actual y la nueva contraseña, que debe tener al menos 8 caracteres con mayúsculas, minúsculas, números y un carácter especial.',
      },
    ],
  },
  {
    category: 'Seguridad y Acceso',
    icon: Shield,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    items: [
      {
        question: '¿Qué hago si olvidé mi contraseña?',
        answer: 'En la pantalla de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?". Ingresa tu correo o cédula y recibirás un código de verificación de 6 dígitos. Úsalo para crear una nueva contraseña.',
      },
      {
        question: '¿Mi sesión puede expirar?',
        answer: 'Por seguridad, tu sesión se cierra automáticamente después de 30 minutos de inactividad. Guarda tu trabajo antes de alejarte del portal.',
      },
    ],
  },
];

const medicoFaqs = [
  {
    category: 'Consultas',
    icon: Calendar,
    color: 'text-primary-500',
    bg: 'bg-primary-50',
    items: [
      {
        question: '¿Cómo completo una consulta?',
        answer: 'En "Mis Consultas", haz clic en la fila de la cita para expandirla y luego en "Completar Consulta". Se abre un formulario donde debes ingresar el diagnóstico (obligatorio), notas adicionales, recetas (una por línea) y exámenes ordenados (uno por línea). Haz clic en "Registrar" para guardar. La cita quedará en estado "Completada" y el paciente recibirá una notificación por correo.',
      },
      {
        question: '¿Puedo ver el historial de un paciente?',
        answer: 'Sí, pero solo de pacientes con los que tienes al menos una cita registrada. Al expandir cualquier cita en "Mis Consultas" verás los datos de contacto del paciente y el número de consultas previas completadas. Para ver el historial médico completo, medicamentos y todas las citas del paciente contigo, el sistema carga ese detalle automáticamente.',
      },
      {
        question: '¿Qué pasa si un paciente cancela su cita?',
        answer: 'Los pacientes gestionan sus propias cancelaciones desde su portal con al menos 24 horas de anticipación. No puedes cancelar citas de pacientes desde el portal médico. Si necesitas reagendar una cita por causas administrativas, comunícate directamente con la sede.',
      },
    ],
  },
  {
    category: 'Prescripciones',
    icon: Pill,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    items: [
      {
        question: '¿Cómo prescribo un medicamento?',
        answer: 'Expande una cita confirmada o completada en "Mis Consultas" y haz clic en "Prescribir Medicamento". Completa el nombre, dosis, presentación, frecuencia (ej: "Cada 8 horas"), horarios separados por coma (ej: "08:00, 16:00, 00:00"), duración en días e instrucciones opcionales. El medicamento queda disponible inmediatamente en el portal del paciente.',
      },
      {
        question: '¿Cuál es la diferencia entre renovable y no renovable?',
        answer: 'Los medicamentos marcados como renovables permiten al paciente solicitar una renovación desde su portal cuando le quedan 7 días o menos. Tú recibirás la solicitud en "Solicitudes de Renovación" para aprobarla o rechazarla. Los medicamentos no renovables no muestran ese botón al paciente; si necesitan continuar el tratamiento, deben agendar una nueva consulta.',
      },
    ],
  },
  {
    category: 'Renovaciones',
    icon: RefreshCw,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    items: [
      {
        question: '¿Cómo apruebo una renovación?',
        answer: 'Ve a "Solicitudes de Renovación". Las solicitudes pendientes aparecen con los datos del paciente y el medicamento. Puedes agregar una nota opcional y luego hacer clic en "Aprobar" o "Rechazar". El paciente recibe una notificación por correo con el resultado.',
      },
      {
        question: '¿Qué pasa cuando rechazo una solicitud?',
        answer: 'La solicitud cambia a estado "Rechazada" y la fecha de vencimiento del medicamento no se modifica. Si escribiste una nota, el paciente podrá verla. Si el paciente necesita continuar el tratamiento, deberá agendar una nueva consulta.',
      },
      {
        question: '¿Cuánto se extiende el medicamento al aprobar?',
        answer: 'Al aprobar, el sistema extiende el medicamento 30 días adicionales. Si la fecha de vencimiento actual aún no ha llegado, los 30 días se suman desde esa fecha. Si el medicamento ya está vencido, los 30 días se cuentan desde el día de hoy.',
      },
    ],
  },
  {
    category: 'Cuenta',
    icon: User,
    color: 'text-secondary-500',
    bg: 'bg-secondary-50',
    items: [
      {
        question: '¿Cómo cambio mi contraseña?',
        answer: 'En "Mi Perfil", en la sección de Seguridad, haz clic en "Cambiar Contraseña". Deberás ingresar tu contraseña actual y la nueva, que debe tener al menos 8 caracteres incluyendo mayúsculas, minúsculas, números y un carácter especial.',
      },
      {
        question: '¿Puedo cambiar mi foto de perfil?',
        answer: 'Sí. En "Mi Perfil", haz clic sobre tu foto o el ícono de edición para cargar una nueva imagen desde tu dispositivo.',
      },
    ],
  },
];

const contactChannels = [
  {
    icon: Phone,
    label: 'Línea de atención',
    value: '01 8000 123 456',
    sub: 'Lun – Vie, 7:00 am – 7:00 pm',
    color: 'text-primary-500',
    bg: 'bg-primary-50',
  },
  {
    icon: Mail,
    label: 'Correo electrónico',
    value: 'atencion@eps.com.co',
    sub: 'Respuesta en menos de 24 horas',
    color: 'text-secondary-500',
    bg: 'bg-secondary-50',
  },
  {
    icon: MessageCircle,
    label: 'Chat en línea',
    value: 'Chat disponible en el portal',
    sub: 'Lun – Sáb, 8:00 am – 6:00 pm',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
];

const HelpPage = () => {
  const { user } = useAuth();
  const [openItems, setOpenItems] = useState({});

  const faqs = user?.role === 'medico' ? medicoFaqs : pacienteFaqs;

  const toggle = (key) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Centro de Ayuda</h1>
        <p className="text-gray-500 text-sm">Encuentra respuestas a las preguntas más frecuentes</p>
      </div>

      {/* FAQ sections */}
      {faqs.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.category}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl ${section.bg} flex items-center justify-center`}>
                <Icon size={18} className={section.color} />
              </div>
              <h2 className="text-base font-semibold text-gray-800">{section.category}</h2>
            </div>
            <div className="space-y-2">
              {section.items.map((item, i) => {
                const key = `${section.category}-${i}`;
                const isOpen = !!openItems[key];
                return (
                  <div key={key} className={`rounded-xl border transition-all ${isOpen ? 'border-primary-200 bg-primary-50/40' : 'border-gray-100 bg-gray-50'}`}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
                    >
                      <span className="text-sm font-medium text-gray-800">{item.question}</span>
                      {isOpen
                        ? <ChevronUp size={16} className="text-primary-500 flex-shrink-0" />
                        : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                      }
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 animate-fade-in-up">
                        <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Contact channels */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <HelpCircle size={18} className="text-gray-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">¿Necesitas más ayuda?</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {contactChannels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div key={ch.label} className={`p-4 rounded-xl ${ch.bg} border border-transparent`}>
                <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon size={16} className={ch.color} />
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{ch.label}</p>
                <p className={`text-sm font-semibold ${ch.color}`}>{ch.value}</p>
                <p className="text-xs text-gray-500 mt-1">{ch.sub}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default HelpPage;
