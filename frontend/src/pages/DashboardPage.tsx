import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Activity,
  Users,
  Timer,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  Gauge,
  Filter,
  ChevronDown,
  RefreshCw,
  Flame,
  Heart,
  MapPin,
  Wind
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
  Legend
} from 'recharts';
import { api } from '../api/client';
import { ExtendedDashboard } from '../types/models';
import { SkeletonPulse } from './HomePage';


const COLORS = {
  electricBlue: '#00D4FF',
  neonLime: '#00E676',
  neonOrange: '#FF9100',
  neonRed: '#FF3D71',
  neonPurple: '#B829DD',
  darkBg: '#0B1120',
  panelBg: 'rgba(15, 23, 42, 0.5)',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
};

// ============================================
// ANIMATION VARIANTS
// ============================================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const pulseVariants: Variants = {
  animate: {
    opacity: [0.4, 1, 0.4],
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ============================================
// GLASS CARD COMPONENT
// ============================================
const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className = '', glowColor }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    className={`
      relative overflow-hidden rounded-2xl
      bg-slate-900/50 backdrop-blur-xl
      border border-white/[0.08]
      shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      hover:shadow-[0_8px_40px_rgba(0,212,255,0.08)]
      hover:border-white/[0.15]
      transition-all duration-300
      ${className}
    `}
  >
    {glowColor && (
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: glowColor }}
      />
    )}
    {children}
  </motion.div>
);

// ============================================
// KPI CARD COMPONENT
// ============================================
const KPICard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}> = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }) => (
  <GlassCard glowColor={color}>
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend === 'up'
                ? 'text-emerald-400 bg-emerald-500/10'
                : trend === 'down'
                ? 'text-red-400 bg-red-500/10'
                : 'text-slate-400 bg-slate-500/10'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
        {value}
      </div>
      <div className="text-sm text-slate-400 font-medium">{title}</div>
      <div className="text-xs text-slate-600 mt-1">{subtitle}</div>
    </div>
  </GlassCard>
);

const formatAthleteId = (id: string): string => {
  return `ID #${id.slice(-6)}`;
};

const AthleteMetricCard: React.FC<{
  title: string;
  subtitle: string;
  data: Array<{ athleteId: string; value: number }> | undefined;
  color: string;
  icon: React.ElementType;
  unit: string;
  decimals?: number;
  loading: boolean;
  delay?: number;
}> = ({
  title,
  subtitle,
  data,
  color,
  icon: Icon,
  unit,
  decimals = 1,
  loading,
  delay = 0,
}) => {
  // Prepara dados ordenados do maior para o menor (top 8)
  const chartData = useMemo(() => {
    if (!data) return [];
    return [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((item) => ({
        ...item,
        displayId: formatAthleteId(item.athleteId),
      }));
  }, [data]);

  // Formata valor conforme unidade
  const formatValue = (val: number): string => {
    if (unit === 'km') return (val / 1000).toFixed(decimals);
    return val.toFixed(decimals);
  };

  return (
    <motion.div variants={itemVariants}>
      <GlassCard glowColor={`${color}20`} className="h-full">
        <div className="p-5 sm:p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1 min-h-[260px]">
            {loading ? (
              <div className="space-y-3 pt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonPulse className="w-16 h-3" />
                    <SkeletonPulse className="flex-1 h-6 rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id={`grad-${title.replace(/\s/g, '')}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: '#475569', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="displayId"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    width={75}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                          <p className="text-slate-400 text-xs mb-1">Athlete {p.athleteId}</p>
                          <p className="text-white font-bold text-lg">
                            {formatValue(p.value)}
                            <span className="text-sm text-slate-500 ml-1">{unit}</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    animationDuration={1200}
                    animationBegin={delay}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#grad-${title.replace(/\s/g, '')})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Footer stat */}
          {!loading && chartData.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-xs text-slate-500">Top {chartData.length} athletes</span>
              <span className="text-xs font-semibold" style={{ color }}>
                {formatValue(chartData[0].value)} {unit} — leader
              </span>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

// ============================================
// CUSTOM RECHARTS TOOLTIP
// ============================================
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
      {label && <p className="text-slate-300 text-xs font-medium mb-2">{label}</p>}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-white font-semibold">
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : parseInt(entry.value).toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export function DashboardPage() {
  const [data, setData] = useState<ExtendedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('Current Month');
  

  useEffect(() => {
    api
      .get<ExtendedDashboard>('/dashboard')
      .then((response) => setData(response.data))
      .catch((err) =>
        setError(err.response?.data?.message || 'Erro ao carregar o dashboard.')
      )
      .finally(() => setLoading(false));
  }, []);

  // Memoized computations
  const criticalFatigue = useMemo(() => {
    if (!data?.fatigueAnalysis) return [];
    return [...data.fatigueAnalysis]
      .sort((a, b) => b.dropPercent - a.dropPercent)
      .slice(0, 5);
  }, [data]);

  const highRiskAthletes = useMemo(() => {
    if (!data?.riskAnalysis) return [];
    return data.riskAnalysis.filter((r) => r.riskLevel === 'high');
  }, [data]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-10 h-10 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <GlassCard className="p-8 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Erro ao Carregar</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium hover:bg-cyan-500/20 transition-colors"
          >
            Tentar Novamente
          </button>
        </GlassCard>
      </div>
    );
  }

  if (!data) return null;

  const normalizedRadarData = data.radarData?.map((item) => {
  const max = item.fullMark || 1; 
  
  return {
    ...item,
    explosive_norm: (item.explosive / max) * 100,
    endurance_norm: (item.endurance / max) * 100,
    lowIntensity_norm: (item.lowIntensity / max) * 100,
    balanced_norm: (item.balanced / max) * 100,
  };
}) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Subtle ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ========================================== */}
        {/* HEADER */}
        {/* ========================================== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Dashboard{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Center
              </span>
            </h1>
          </div>

          {/* Global Filters - Glassmorphism */}
          <div className="flex items-center gap-2 sm:gap-3">
            {['Current Month', 'Last Week', 'Season'].map((filter) => (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveFilter(filter)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium
                  backdrop-blur-md border transition-all duration-200
                  ${
                    activeFilter === filter
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.1)]'
                      : 'bg-slate-900/40 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]'
                  }
                `}
              >
                <Filter className="w-3.5 h-3.5" />
                {filter}
                {activeFilter === filter && <ChevronDown className="w-3 h-3" />}
              </motion.button>
            ))}
          </div>
        </motion.header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* ========================================== */}
          {/* TOP ROW - KPI CARDS */}
          {/* ========================================== */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <KPICard
              title="Athletes"
              value={data.summary.totalAthletes}
              subtitle="Active roster"
              icon={Users}
              color={COLORS.electricBlue}
            />
            <KPICard
              title="Sessions"
              value={data.summary.totalSessions}
              subtitle="Total accumulated"
              icon={Activity}
              color={COLORS.neonPurple}
              trend="up"
              trendValue="+12%"
            />
            <KPICard
              title="Average Distance"
              value={`${data.summary.avgDistance.toFixed(1)}km`}
              subtitle="Per session"
              icon={MapPin}
              color={COLORS.neonLime}
            />
            <KPICard
              title="Average Load"
              value={data.summary.avgSessionLoad.toFixed(1)}
              subtitle="AU per session"
              icon={Gauge}
              color={COLORS.electricBlue}
              trend="up"
              trendValue="+5%"
            />
            <KPICard
              title="Average Top Speed"
              value={`${data.summary.avgTopSpeed.toFixed(1)}km/h`}
              subtitle="Peak recorded"
              icon={Zap}
              color={COLORS.neonOrange}
            />
            <KPICard
              title="Active Alerts"
              value={data.summary.activeAlerts}
              subtitle="Require attention"
              icon={AlertTriangle}
              color={COLORS.neonRed}
              trend="down"
              trendValue="-2"
            />
          </div>

          {/* ========================================== */}
          {/* CRITICAL FATIGUE ALERT SECTION */}
          {/* ========================================== */}
          {criticalFatigue.length > 0 && (
            <motion.div variants={itemVariants}>
              <GlassCard
                className="border-red-500/20"
                glowColor="rgba(255, 61, 113, 0.15)"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <motion.div
                      variants={pulseVariants}
                      animate="animate"
                      className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center"
                    >
                      <Flame className="w-5 h-5 text-red-400" />
                    </motion.div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Critical Alert: Drop in Performance
                      </h2>
                      <p className="text-xs text-slate-500">
                        Maiores quedas detectadas pelo modelo (Isolation Forest) — sessão atual vs histórico do atleta
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {criticalFatigue.map((player, idx) => (
                      <motion.div
                        key={player.athleteId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.03 }}
                        className={`
                          relative p-4 rounded-xl border backdrop-blur-sm
                          ${
                            player.dropPercent > 25
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-orange-500/10 border-orange-500/30'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-white">
                            {player.athleteId}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              player.dropPercent > 25
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}
                          >
                            -{player.dropPercent.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
                          {player.metric}
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Histórico</span>
                            <span className="text-emerald-400 font-medium">
                              {player.baseline.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Atual</span>
                            <span className="text-red-400 font-medium">
                              {player.current.toFixed(1)}
                            </span>
                          </div>
                          {/* Visual bar showing drop */}
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${player.dropPercent}%` }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className={`h-full rounded-full ${
                                player.dropPercent > 25
                                  ? 'bg-gradient-to-r from-red-500 to-red-400'
                                  : 'bg-gradient-to-r from-orange-500 to-orange-400'
                              }`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* CENTER PANELS: RADAR + RISK MATRIX */}
          {/* ========================================== */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* RADAR CHART - Physical Profiles */}
            <GlassCard glowColor="rgba(0, 212, 255, 0.1)">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                    <Target className="w-4.5 h-4.5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Physical Profile Radar
                    </h3>
                    <p className="text-xs text-slate-500">
                      Multidimensional profile comparison
                    </p>
                  </div>
                </div>

                <div className="h-[320px] sm:h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                      data={normalizedRadarData}
                    >
                      {/* 
                        PolarGrid em branco semi-transparente para manter 
                        a estética dark sem competir com os dados neon 
                      */}
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#475569', fontSize: 10 }}
                        axisLine={false}
                      />
                      {/* 
                        Cores neon para cada perfil:
                        - Explosivo: Vermelho neon (alta intensidade)
                        - Resistência: Verde limão (sustentabilidade)
                        - Baixa Intensidade: Azul elétrico (recuperação)
                      */}
                     <Radar
    name="Explosive"
    dataKey="explosive_norm" 
    stroke={COLORS.neonRed}
    fill={COLORS.neonRed}
    fillOpacity={0.15}
    strokeWidth={2}
  />
  <Radar
    name="Endurance"
    dataKey="endurance_norm"
    stroke={COLORS.neonLime}
    fill={COLORS.neonLime}
    fillOpacity={0.15}
    strokeWidth={2}
  />
  <Radar
    name="Low Intensity"
    dataKey="lowIntensity_norm"
    stroke={COLORS.electricBlue}
    fill={COLORS.electricBlue}
    fillOpacity={0.15}
    strokeWidth={2}
  />
  <Radar
    name="Balanced"
    dataKey="balanced_norm"
    stroke={COLORS.neonPurple}
    fill={COLORS.neonPurple}
    fillOpacity={0.15}
    strokeWidth={2}
  />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>

            {/* RISK MATRIX - Scatter Plot */}
            <GlassCard glowColor="rgba(255, 61, 113, 0.1)">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                    <Heart className="w-4.5 h-4.5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Injury Risk Matrix
                    </h3>
                    <p className="text-xs text-slate-500">
                      Workload (X) vs Decelerations (Y)
                    </p>
                  </div>
                </div>

                <div className="h-[320px] sm:h-[390px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        type="number"
                        dataKey="workload"
                        name="Workload"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        label={{
                          value: 'Workload (AU)',
                          position: 'bottom',
                          fill: '#475569',
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="decelerations"
                        name="Decelerations"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        label={{
                          value: 'Decelerations',
                          angle: -90,
                          position: 'insideLeft',
                          fill: '#475569',
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
                              <p className="text-white font-bold text-sm mb-1">
                                {p.athleteId}
                              </p>
                              <p className="text-slate-400 text-xs">
                                Workload:{' '}
                                <span className="text-cyan-400">{p.workload.toFixed(1)}</span>
                              </p>
                              <p className="text-slate-400 text-xs">
                                Decelerations:{' '}
                                <span className="text-orange-400">
                                  {p.decelerations.toFixed(1)}
                                </span>
                              </p>
                              <p
                                className={`text-xs font-semibold mt-1 ${
                                  p.riskLevel === 'high'
                                    ? 'text-red-400'
                                    : p.riskLevel === 'medium'
                                    ? 'text-orange-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                Risk:{' '}
                                {p.riskLevel === 'high'
                                  ? 'HIGH'
                                  : p.riskLevel === 'medium'
                                  ? 'MEDIUM'
                                  : 'LOW'}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Scatter
                        name="Atletas"
                        data={data.riskAnalysis || []}
                        shape={(props: any) => {
                          const { cx, cy, payload } = props;
                          const isHighRisk =
                            payload.workload > 450 && payload.decelerations > 35;
                          const color = isHighRisk
                            ? COLORS.neonRed
                            : payload.riskLevel === 'medium'
                            ? COLORS.neonOrange
                            : COLORS.neonLime;
                          return (
                            <g>
                              {/* Glow effect for high risk */}
                              {isHighRisk && (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={12}
                                  fill={COLORS.neonRed}
                                  opacity={0.2}
                                >
                                  <animate
                                    attributeName="r"
                                    values="8;14;8"
                                    dur="2s"
                                    repeatCount="indefinite"
                                  />
                                  <animate
                                    attributeName="opacity"
                                    values="0.3;0.1;0.3"
                                    dur="2s"
                                    repeatCount="indefinite"
                                  />
                                </circle>
                              )}
                              <circle cx={cx} cy={cy} r={6} fill={color} />
                              <circle
                                cx={cx}
                                cy={cy}
                                r={3}
                                fill="white"
                                opacity={0.5}
                              />
                            </g>
                          );
                        }}
                      />
                      {/* 
                        Reference lines para delimitar o quadrante de alto risco.
                        Workload > 450 e Decelerations > 35 = zona crítica vermelha
                      */}
                      <line
                        x1={450}
                        y1={0}
                        x2={450}
                        y2={100}
                        stroke={COLORS.neonRed}
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                      />
                      <line
                        x1={200}
                        y1={35}
                        x2={600}
                        y2={35}
                        stroke={COLORS.neonRed}
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                {/* Risk Legend */}
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-slate-500">High Risk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-slate-500">Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-500">Low Risk</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* ========================================== */}
          {/* BOTTOM ROW - CHARTS */}
          {/* ========================================== */}
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Workload Evolution - Area Chart */}
            <GlassCard glowColor="rgba(0, 212, 255, 0.08)">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Workload Evolution
                    </h3>
                    <p className="text-xs text-slate-500">Last 14 sessions</p>
                  </div>
                </div>

                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.workloadEvolution}>
                      <defs>
                        <linearGradient
                          id="workloadGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.electricBlue}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.electricBlue}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="distanceGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.neonLime}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.neonLime}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        tickFormatter={(val) =>
                          new Date(val).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })
                        }
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="workload"
                        name="Carga (AU)"
                        stroke={COLORS.electricBlue}
                        strokeWidth={2}
                        fill="url(#workloadGradient)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="distance"
                        name="Distância (km)"
                        stroke={COLORS.neonLime}
                        strokeWidth={2}
                        fill="url(#distanceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>

            {/* Workload Ranking - Horizontal Bar */}
            <GlassCard glowColor="rgba(0, 230, 118, 0.08)">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Wind className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Workload Ranking
                    </h3>
                    <p className="text-xs text-slate-500">Top athletes by AU</p>
                  </div>
                </div>

                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.rankingByWorkload.slice(0, 6)}
                      layout="vertical"
                      margin={{ left: 0, right: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: '#64748B', fontSize: 10 }}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="athleteId"
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        width={70}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        name="Carga (AU)"
                        radius={[0, 6, 6, 0]}
                      >
                        {data.rankingByWorkload.slice(0, 6).map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              i < 2
                                ? COLORS.neonLime
                                : i < 4
                                ? COLORS.electricBlue
                                : COLORS.neonPurple
                            }
                            fillOpacity={0.8}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>

            {/* Active Alerts Feed */}
            <GlassCard glowColor="rgba(255, 145, 0, 0.08)">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-4.5 h-4.5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Active Alerts
                    </h3>
                    <p className="text-xs text-slate-500">
                      {data.alerts.length} pending notifications
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  <AnimatePresence>
                    {data.alerts.map((alert, idx) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ x: 4 }}
                        className={`
                          p-3 rounded-xl border cursor-pointer transition-colors
                          ${
                            alert.severity === 'high'
                              ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                              : 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-white">
                                {alert.athleteId}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                  alert.severity === 'high'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-orange-500/20 text-orange-400'
                                }`}
                              >
                                {alert.severity === 'high' ? 'CRITICAL' : 'MEDIUM'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-slate-600">
                                <TrendingDown className="w-3 h-3 inline mr-0.5" />
                                {alert.dropPercent.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-slate-600">
                                {alert.metric}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </GlassCard>
          </div>
                    <motion.div
  variants={containerVariants}
  className="grid lg:grid-cols-3 gap-4 sm:gap-6"
>
  <AthleteMetricCard
    title="Distance per Athlete"
    subtitle="Total accumulated per session"
    data={data.distanceByAthlete}
    color={COLORS.neonLime}
    icon={MapPin}
    unit="km"
    decimals={2}
    loading={loading}
    delay={200}
  />

  <AthleteMetricCard
    title="Sprints per Athlete"
    subtitle="High-intensity accelerations"
    data={data.sprintByAthlete}
    color={COLORS.neonOrange}
    icon={Zap}
    unit="sprints"
    decimals={0}
    loading={loading}
    delay={350}
  />

  <AthleteMetricCard
    title="Maximum Velocity"
    subtitle="Peak speed recorded"
    data={data.topSpeedByAthlete}
    color={COLORS.electricBlue}
    icon={Wind}
    unit="km/h"
    decimals={1}
    loading={loading}
    delay={500}
  />
</motion.div>

          {/* ========================================== */}
          {/* FOOTER INFO */}
          {/* ========================================== */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between text-xs text-slate-600 pt-4 border-t border-white/[0.04]"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              <span>FieldVision Dashboard Center v1.0</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Last updated: {new Date().toLocaleTimeString('pt-BR')}</span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live System
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}

// Target icon fallback since lucide might not export it directly in some versions
const Target = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);