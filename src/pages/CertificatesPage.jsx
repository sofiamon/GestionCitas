import React, { useState } from 'react';
import { IdCard, FileText, FileCheck, Calendar, Download, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  generateAffiliationCertificate,
  generateMedicalHistoryPDF,
  generateAllAuthorizationsPDF,
  generateAppointmentConfirmation,
} from '../utils/pdfGenerator';

// ─── Certificate card ─────────────────────────────────────────────────────────

const CertCard = ({ icon: Icon, title, description, accentClass, onDownload, loading }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
    {/* Accent top strip */}
    <div className={`h-1.5 w-full ${accentClass}`} />

    <div className="flex flex-col flex-1 p-6 gap-4">
      {/* Icon */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${accentClass} bg-opacity-15`}>
        <Icon size={28} className="text-white" />
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-1">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>

      {/* Button */}
      <button
        onClick={onDownload}
        disabled={loading}
        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading
          ? <Loader2 size={16} className="animate-spin" />
          : <Download size={16} />
        }
        {loading ? 'Generando...' : 'Descargar PDF'}
      </button>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const CertificatesPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loadingHistory, setLoadingHistory]     = useState(false);
  const [loadingAuth, setLoadingAuth]           = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const handleAffiliation = () => {
    try {
      generateAffiliationCertificate(user);
      showToast({ type: 'success', title: 'Descargado', message: 'Certificado de afiliación generado' });
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo generar el certificado' });
    }
  };

  const handleHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getMedicalHistory();
      generateMedicalHistoryPDF(user, data);
      showToast({ type: 'success', title: 'Descargado', message: 'Historial médico generado' });
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo generar el historial' });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAuthorizations = async () => {
    setLoadingAuth(true);
    try {
      const data = await api.getAuthorizations('aprobada');
      generateAllAuthorizationsPDF(user, data);
      showToast({ type: 'success', title: 'Descargado', message: 'Autorizaciones aprobadas generadas' });
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo generar el documento' });
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const all = await api.getAppointments();
      const active = all.filter(a => a.estado === 'confirmada' || a.estado === 'pendiente');
      if (active.length === 0) {
        showToast({ type: 'warning', title: 'Sin citas activas', message: 'No tienes citas confirmadas o pendientes' });
        return;
      }
      // Generate one PDF per active appointment
      active.forEach(apt => generateAppointmentConfirmation(user, apt));
      showToast({ type: 'success', title: 'Descargado', message: `${active.length} comprobante${active.length > 1 ? 's' : ''} generado${active.length > 1 ? 's' : ''}` });
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo generar los comprobantes' });
    } finally {
      setLoadingAppointments(false);
    }
  };

  const cards = [
    {
      icon: IdCard,
      title: 'Certificado de Afiliación',
      description: 'Documento oficial que acredita tu afiliación al sistema de salud.',
      accentClass: 'gradient-primary',
      onDownload: handleAffiliation,
      loading: false,
    },
    {
      icon: FileText,
      title: 'Historial Médico Completo',
      description: 'Resumen de todas tus consultas, diagnósticos, recetas y exámenes.',
      accentClass: 'bg-gradient-to-r from-secondary-500 to-cyan-500',
      onDownload: handleHistory,
      loading: loadingHistory,
    },
    {
      icon: FileCheck,
      title: 'Autorizaciones Aprobadas',
      description: 'Todas tus autorizaciones médicas vigentes en un solo documento.',
      accentClass: 'bg-gradient-to-r from-green-500 to-emerald-400',
      onDownload: handleAuthorizations,
      loading: loadingAuth,
    },
    {
      icon: Calendar,
      title: 'Comprobantes de Citas Activas',
      description: 'Comprobantes de tus citas confirmadas y pendientes.',
      accentClass: 'bg-gradient-to-r from-amber-500 to-orange-400',
      onDownload: handleAppointments,
      loading: loadingAppointments,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Mis Certificados</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Descarga tus documentos oficiales
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cards.map(card => (
          <CertCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
};

export default CertificatesPage;
