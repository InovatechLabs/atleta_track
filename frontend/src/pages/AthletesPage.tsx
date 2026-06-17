import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  Shield,
  Zap,
  Timer,
  Activity,
  TrendingUp,
  RefreshCw,
  User,
  ArrowUpDown,
  LayoutGrid,
  List
} from 'lucide-react';
import { api } from '../api/client';
import { Athlete } from '../types/models';
import { profileLabel } from '../utils/format';

// ============================================
// COLOR PALETTE
// ============================================
const COLORS = {
  electricBlue: '#00D4FF',
  neonLime: '#00E676',
  neonRed: '#FF3D71',
  neonOrange: '#FF9100',
  neonPurple: '#B829DD',
  neonPink: '#FF2E93',
};

// ============================================
// PROFILE COLOR MAP
// ============================================
const getProfileColor = (profile: string): string => {
  const map: Record<string, string> = {
    balanced: COLORS.electricBlue,
    highImpactLoad: COLORS.neonOrange,
    endurance: COLORS.neonLime,
    explosive: COLORS.neonRed,
    tactical: COLORS.neonPurple,
    lowIntensity: COLORS.neonPink,
  };
  return map[profile.toLowerCase()] || COLORS.electricBlue;
};

const getProfileIcon = (profile: string) => {
  const p = profile.toLowerCase();
  if (p.includes('explosive') || p.includes('highimpact')) return Zap;
  if (p.includes('endurance')) return Timer;
  if (p.includes('tactical')) return Shield;
  return Activity;
};

// ============================================
// ANIMATION VARIANTS
// ============================================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// ============================================
// GLASS CARD
// ============================================
const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}> = ({ children, className = '', glowColor, onClick }) => (
  <motion.div
    variants={itemVariants}
    whileHover={onClick ? { y: -2, transition: { duration: 0.2 } } : undefined}
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl
      bg-slate-900/50 backdrop-blur-md
      border border-white/[0.08]
      shadow-[0_8px_32px_rgba(0,0,0,0.3)]
      hover:shadow-[0_8px_40px_rgba(0,212,255,0.08)]
      hover:border-white/[0.15]
      transition-all duration-300
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {glowColor && (
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: glowColor }}
      />
    )}
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

// ============================================
// SKELETON
// ============================================
const SkeletonPulse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div
    animate={{ opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    className={`bg-slate-800/60 rounded-lg ${className}`}
  />
);

// ============================================
// MAIN COMPONENT
// ============================================
export function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Athlete[]>('/athletes')
      .then(response => setAthletes(response.data))
      .catch(err => {
        console.error("Erro ao carregar atletas:", err);
        setError('Não foi possível carregar o elenco.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter athletes
  const filteredAthletes = useMemo(() => {
    if (!searchTerm) return athletes;
    const term = searchTerm.toLowerCase();
    return athletes.filter(a => 
      a.id.toLowerCase().includes(term) ||
      a.position?.toLowerCase().includes(term) ||
      a.groups?.toLowerCase().includes(term) ||
      a.profile.toLowerCase().includes(term)
    );
  }, [athletes, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = athletes.length;
    const byProfile = athletes.reduce((acc, a) => {
      acc[a.profile] = (acc[a.profile] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, byProfile };
  }, [athletes]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <SkeletonPulse className="w-48 h-8 mb-2" />
              <SkeletonPulse className="w-32 h-4" />
            </div>
            <SkeletonPulse className="w-24 h-10 rounded-xl" />
          </div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <SkeletonPulse key={i} className="h-24 rounded-2xl" />
            ))}
          </div>

          {/* Table skeleton */}
          <div className="space-y-3">
            <SkeletonPulse className="h-12 rounded-xl" />
            {[1,2,3,4,5].map(i => (
              <SkeletonPulse key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* ========================================== */}
        {/* HEADER */}
        {/* ========================================== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Users className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                Active Roster
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Athletes
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {stats.total} athletes recorded • {Object.keys(stats.byProfile).length} profiles identified
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="p-2.5 rounded-xl bg-slate-900/50 border border-white/[0.08] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* ========================================== */}
        {/* STATS CARDS */}
        {/* ========================================== */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        >
          <GlassCard glowColor="rgba(0, 230, 118, 0.1)">
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-500">Total</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">active athletes</div>
            </div>
          </GlassCard>

          <GlassCard glowColor="rgba(0, 212, 255, 0.1)">
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-500">Largest Profile</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {Object.entries(stats.byProfile).sort((a,b) => b[1] - a[1])[0]?.[1] || 0}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">
                {profileLabel(Object.entries(stats.byProfile).sort((a,b) => b[1] - a[1])[0]?.[0] || '')}
              </div>
            </div>
          </GlassCard>

          <GlassCard glowColor="rgba(255, 145, 0, 0.1)">
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-slate-500">Explosive</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.byProfile['explosive'] || stats.byProfile['highImpactLoad'] || 0}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">high intensity</div>
            </div>
          </GlassCard>

          <GlassCard glowColor="rgba(184, 41, 221, 0.1)">
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-500">Profiles</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {Object.keys(stats.byProfile).length}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">categories</div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ========================================== */}
        {/* TOOLBAR: Search + Filters + View Toggle */}
        {/* ========================================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, position, group or profile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/[0.08] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filter button (visual) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/[0.08] text-slate-400 text-sm hover:text-white hover:border-white/[0.15] transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </motion.button>

            {/* View mode toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/50 border border-white/[0.08]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'cards'
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ========================================== */}
        {/* ERROR STATE */}
        {/* ========================================== */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* ========================================== */}
        {/* EMPTY STATE */}
        {/* ========================================== */}
        {!loading && filteredAthletes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <User className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No athletes found</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting the search filters</p>
          </motion.div>
        )}

        {/* ========================================== */}
        {/* CARDS VIEW (Mobile-first default) */}
        {/* ========================================== */}
        <AnimatePresence mode="wait">
          {viewMode === 'cards' && !loading && (
            <motion.div
              key="cards"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredAthletes.map((athlete) => {
                const profileColor = getProfileColor(athlete.profile);
                const ProfileIcon = getProfileIcon(athlete.profile);
                
                return (
                  <GlassCard
                    key={athlete.id}
                    glowColor={`${profileColor}15`}
                    onClick={() => navigate(`/atletas/${athlete.id}`)}
                  >
                    <div className="p-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background: `${profileColor}15`,
                            border: `1px solid ${profileColor}25`,
                          }}
                        >
                          <ProfileIcon className="w-6 h-6" style={{ color: profileColor }} />
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.1, x: 2 }}
                          className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-500"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      </div>

                      {/* Info */}
                      <h3 className="text-lg font-bold text-white mb-1">
                        ID #{athlete.id.slice(-6)}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4 font-mono">
                        {athlete.id}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {athlete.position && (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/60 text-slate-300 border border-white/[0.06]">
                            {athlete.position}
                          </span>
                        )}
                        {athlete.groups && (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/60 text-slate-300 border border-white/[0.06]">
                            {athlete.groups}
                          </span>
                        )}
                        <span
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                          style={{
                            background: `${profileColor}12`,
                            color: profileColor,
                            border: `1px solid ${profileColor}25`,
                          }}
                        >
                          {profileLabel(athlete.profile)}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TABLE VIEW (Desktop) */}
          {/* ========================================== */}
          {viewMode === 'table' && !loading && (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-slate-900/60">
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          Atleta
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Group
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Physical Profile
                      </th>
                      <th className="py-4 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredAthletes.map((athlete, idx) => {
                      const profileColor = getProfileColor(athlete.profile);
                      const ProfileIcon = getProfileIcon(athlete.profile);
                      
                      return (
                        <motion.tr
                          key={athlete.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                          onClick={() => navigate(`/atletas/${athlete.id}`)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: `${profileColor}12`,
                                  border: `1px solid ${profileColor}20`,
                                }}
                              >
                                <ProfileIcon className="w-4 h-4" style={{ color: profileColor }} />
                              </div>
                              <div>
                                <div className="font-semibold text-white text-sm">
                                  #{athlete.id.slice(-6)}
                                </div>
                                <div className="text-[11px] text-slate-600 font-mono">
                                  {athlete.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-300">
                              {athlete.position || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-300">
                              {athlete.groups || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{
                                background: `${profileColor}12`,
                                color: profileColor,
                                border: `1px solid ${profileColor}25`,
                              }}
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: profileColor }}
                              />
                              {profileLabel(athlete.profile)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <motion.button
                              whileHover={{ scale: 1.05, x: 2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/atletas/${athlete.id}`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                            >
                              Details
                              <ChevronRight className="w-3 h-3" />
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}