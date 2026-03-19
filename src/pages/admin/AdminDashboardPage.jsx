import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Stethoscope, Calendar, RefreshCw,
  FileCheck, Building, UserPlus, ArrowRight, Layers,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { ROUTES } from '../../utils/constants';
import { getCurrentDateFormatted } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const PIE_COLORS = ['#6366f1', '#06b6d4', '#22c55e', '#f97316', '#ec4899'];

const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <Card>
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  </Card>
);

const QuickActionBtn = ({ icon: Icon, label, to, iconBg, iconColor }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all group cursor-pointer w-full text-left"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">{label}</span>
      <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors" />
    </button>
  );
};

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    api.getAdminDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const axisColor  = isDark ? '#94a3b8' : '#6b7280';
  const gridColor  = isDark ? '#1e293b' : '#f1f5f9';
  const tooltipBg  = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  // Format "2026-03" → "Mar"
  const chartMonths = (data?.citasPorMes || []).map(m => ({
    mes: MONTH_NAMES[parseInt(m.mes.split('-')[1], 10) - 1] || m.mes,
    total: m.total,
  }));

  const pieData = (data?.citasPorEspecialidad || []).map(e => ({
    name: e.especialidad,
    value: e.total,
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Panel de Administración</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{getCurrentDateFormatted()}</p>
      </div>

      {/* Row 1 stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}      label="Afiliados activos"       value={data?.totalUsuarios}       iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600 dark:text-violet-400" />
          <StatCard icon={Stethoscope} label="Médicos registrados"    value={data?.totalMedicos}        iconBg="bg-cyan-100 dark:bg-cyan-900/30"     iconColor="text-cyan-600 dark:text-cyan-400" />
          <StatCard icon={Calendar}   label="Citas hoy"               value={data?.citasHoy}            iconBg="bg-green-100 dark:bg-green-900/30"   iconColor="text-green-600 dark:text-green-400" />
          <StatCard icon={RefreshCw}  label="Renovaciones pendientes" value={data?.renovacionesPendientes} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400" />
        </div>
      )}

      {/* Row 2 stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar}  label="Total citas"                  value={data?.totalCitas}               iconBg="bg-gray-100 dark:bg-gray-700"       iconColor="text-gray-600 dark:text-gray-300" />
          <StatCard icon={FileCheck} label="Autorizaciones pendientes"    value={data?.autorizacionesPendientes} iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-orange-600 dark:text-orange-400" />
          <StatCard icon={Building}  label="Sedes activas"                value={data?.totalSedes}               iconBg="bg-blue-100 dark:bg-blue-900/30"    iconColor="text-blue-600 dark:text-blue-400" />
          <StatCard icon={UserPlus}  label="Nuevos afiliados (30d)"       value={data?.registrosUltimos30Dias}   iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400" />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart: citas por mes */}
        <Card>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-5">Citas por Mes <span className="text-xs font-normal text-gray-400">(últimos 6 meses)</span></h3>
          {loading ? (
            <Skeleton lines={4} className="h-56" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMonths} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)' }}
                    contentStyle={{ fontSize: 12, background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 10 }}
                    formatter={(val) => [val, 'Citas']}
                  />
                  <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} name="Citas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Pie chart: citas por especialidad */}
        <Card>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-5">Top Especialidades</h3>
          {loading ? (
            <Skeleton lines={4} className="h-56" />
          ) : pieData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 10 }}
                    formatter={(val, name) => [val, name]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Accesos Rápidos</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionBtn icon={Users}       label="Gestionar Usuarios"      to={ROUTES.ADMIN_USERS}       iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600 dark:text-violet-400" />
          <QuickActionBtn icon={Stethoscope} label="Gestionar Médicos"       to={ROUTES.ADMIN_DOCTORS}     iconBg="bg-cyan-100 dark:bg-cyan-900/30"     iconColor="text-cyan-600 dark:text-cyan-400" />
          <QuickActionBtn icon={Building}    label="Gestionar Sedes"         to={ROUTES.ADMIN_LOCATIONS}   iconBg="bg-blue-100 dark:bg-blue-900/30"     iconColor="text-blue-600 dark:text-blue-400" />
          <QuickActionBtn icon={Layers}      label="Gestionar Especialidades" to={ROUTES.ADMIN_SPECIALTIES} iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400" />
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
