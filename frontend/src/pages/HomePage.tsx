import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useVelocity, AnimatePresence, Variants } from 'framer-motion';
import { 
  Brain, 
  Users, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3,
  ChevronRight,
  Menu,
  X,
  LineChart,
  Radar,
  TrendingDown,
  ShieldAlert
} from 'lucide-react';
import fvlogo from '../assets/123.png';
import fvicon from '../assets/fvicon.png';
import { api } from '../api/client';
import { AlertItem, ComparisonData, PreviewData, ProfileItem } from '../types/preview';
import { PieChart, ResponsiveContainer } from 'recharts';
import { Cell, Pie, Tooltip } from 'recharts';

// ============================================
// TYPES
// ============================================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  stats: string;
}


const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: "Profile Mapping with AI",
    description: "Automatic classification of athletes into precise physiological profiles: explosive, high endurance, hybrid, or tactical. Our algorithms analyze 200+ metrics per session.",
    color: "#00E676",
    stats: "200+ metrics"
  },
  {
    icon: Users,
    title: "Smart Athlete Comparison",
    description: "Multidimensional data cross-reference to identify ideal substitutions. Compare speed, endurance, heat map, and tactical decisions in real-time.",
    color: "#00D4FF",
    stats: "Real-time Comparison"
  },
  {
    icon: AlertTriangle,
    title: "Anomaly Detection",
    description: "Automatic alerts about performance drops, injury risk, and accumulated fatigue. Proactive prevention based on historical patterns and predictive AI.",
    color: "#FF6B6B",
    stats: "48h Predictive Analysis"
  }
];

const COLORS = {
  electricBlue: '#00D4FF',
  neonLime: '#00E676',
  neonRed: '#FF3D71',
  neonOrange: '#FF9100',
  neonPurple: '#B829DD',
};

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const pulseVariants: Variants = {
  animate: {
    opacity: [0.4, 1, 0.4],
    scale: [1, 1.2, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

const tickerVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.15, duration: 0.4 },
  }),
};


export const SkeletonPulse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div
    animate={{ opacity: [0.3, 0.6, 0.3] }}
    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    className={`bg-slate-800/60 rounded-lg ${className}`}
  />
);


const TacticalNetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let particles: Particle[] = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };
    
    const initParticles = () => {
      particles = [];
      const particleCount = Math.min(Math.floor(window.innerWidth / 10), 100);
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1
        });
      }
    };
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      
      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 150) {
            const opacity = (1 - dist / 150) * 0.3;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });
      
      // Draw particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 230, 118, 0.6)';
        ctx.fill();
        
        // Glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 230, 118, 0.1)';
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    resize();
    window.addEventListener('resize', resize);
    draw();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

// ============================================
// GLASS CARD COMPONENT
// ============================================
const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}> = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ 
        y: -8, 
        transition: { duration: 0.3, ease: "easeOut" } 
      }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        hover:shadow-[0_8px_40px_rgba(0,230,118,0.15)]
        hover:border-emerald-500/30
        transition-colors duration-500
        ${className}
      `}
    >
      {/* Inner glow on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />
      </div>
      {children}
    </motion.div>
  );
};



const ProfileCard: React.FC<{
  data: ProfileItem[] | null;
  loading: boolean;
}> = ({ data, loading }) => {
  const formatProfileName = (name: string): string => {
    const map: Record<string, string> = {
      balanced: 'Balanced',
      highImpactLoad: 'High Impact',
      endurance: 'Endurance',
      explosive: 'Explosive',
      tactical: 'Tactical',
    };
    return map[name] || name.replace(/([A-Z])/g, ' $1').trim();
  };

  const chartData = data?.map((item) => ({
    name: formatProfileName(item.profile),
    value: item.count,
    rawProfile: item.profile,
  })) || [];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const PROFILE_COLORS = [COLORS.neonLime, COLORS.electricBlue, COLORS.neonPurple, COLORS.neonOrange, COLORS.neonRed];

  return (
    <GlassCard delay={0} glowColor="rgba(0, 230, 118, 0.15)">
      <div className="relative z-10 p-6 sm:p-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: `linear-gradient(135deg, ${COLORS.neonLime}20, ${COLORS.neonLime}10)`,
            border: `1px solid ${COLORS.neonLime}30`,
          }}
        >
          <Brain className="w-7 h-7" style={{ color: COLORS.neonLime }} />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Profile Mapping with AI
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Automatic classification of athletes into precise physiological profiles using machine learning.
        </p>

        <div className="relative h-[180px] mb-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="relative w-32 h-32">
                <SkeletonPulse className="absolute inset-0 rounded-full" />
                <SkeletonPulse className="absolute inset-4 rounded-full bg-slate-900/80" />
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PROFILE_COLORS[index % PROFILE_COLORS.length]}
                      fillOpacity={0.85}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0];
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 shadow-xl">
                        <p className="text-white text-xs font-semibold">{p.name}</p>
                        <p className="text-slate-400 text-xs">{p.value} athletes</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {!loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white">{total}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Athletes</span>
            </div>
          )}
        </div>

        {!loading && chartData.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {chartData.map((item, idx) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 border border-white/[0.06]"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: PROFILE_COLORS[idx % PROFILE_COLORS.length] }}
                />
                <span className="text-xs text-slate-300">{item.name}</span>
                <span className="text-xs text-slate-500">({item.value})</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

// ============================================
// CARD 2: SMART COMPARISON - SPEEDOMETER
// ============================================
const ComparisonCard: React.FC<{
  data: ComparisonData | null;
  loading: boolean;
}> = ({ data, loading }) => {
  const avgSpeed = data ? parseFloat(data.avgSpeedKph) : 0;
  const maxSpeed = data ? parseFloat(data.maxSpeedKph) : 0;
  const percentage = maxSpeed > 0 ? (avgSpeed / maxSpeed) * 100 : 0;

  const radius = 70;
  const strokeWidth = 10;
  const centerX = 90;
  const centerY = 90;
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const startPt = polarToCartesian(cx, cy, r, end);
    const endPt = polarToCartesian(cx, cy, r, start);
    const largeArc = end - start <= 180 ? 0 : 1;
    return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 0 ${endPt.x} ${endPt.y}`;
  };

  const activeAngle = startAngle + (percentage / 100) * totalAngle;
  const bgArc = describeArc(centerX, centerY, radius, startAngle, endAngle);
  const activeArc = describeArc(centerX, centerY, radius, startAngle, activeAngle);

  return (
    <GlassCard delay={0.15} glowColor="rgba(0, 212, 255, 0.15)">
      <div className="relative z-10 p-6 sm:p-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: `linear-gradient(135deg, ${COLORS.electricBlue}20, ${COLORS.electricBlue}10)`,
            border: `1px solid ${COLORS.electricBlue}30`,
          }}
        >
          <Users className="w-7 h-7" style={{ color: COLORS.electricBlue }} />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Intelligent Comparison
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Multidimensional data cross-referencing to identify ideal replacements in real time.

        </p>

        <div className="relative h-[160px] flex items-center justify-center mb-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <SkeletonPulse className="w-32 h-16 rounded-t-full" />
              <SkeletonPulse className="w-20 h-4" />
            </div>
          ) : (
            <div className="relative">
              <svg width="180" height="140" viewBox="0 0 180 140">
                <path
                  d={bgArc}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={COLORS.electricBlue} />
                    <stop offset="100%" stopColor={COLORS.neonLime} />
                  </linearGradient>
                </defs>
                <motion.path
                  d={activeArc}
                  fill="none"
                  stroke="url(#speedGradient)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                />
                {[0, 25, 50, 75, 100].map((tick) => {
                  const angle = startAngle + (tick / 100) * totalAngle;
                  const inner = polarToCartesian(centerX, centerY, radius - 15, angle);
                  const outer = polarToCartesian(centerX, centerY, radius - 5, angle);
                  return (
                    <line
                      key={tick}
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </svg>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <span className="text-3xl font-bold text-white">{avgSpeed.toFixed(1)}</span>
                  <span className="text-sm text-slate-500 ml-1">km/h</span>
                </motion.div>
                <p className="text-[10px] text-slate-600 mt-0.5">Average</p>
              </div>
            </div>
          )}
        </div>

        {!loading && (
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Average Speed</span>
                <span className="text-cyan-400 font-semibold">{avgSpeed.toFixed(1)} km/h</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(avgSpeed / maxSpeed) * 100}%` }}
                  transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Maximum Speed</span>
                <span className="text-emerald-400 font-semibold">{maxSpeed.toFixed(1)} km/h</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, delay: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-slate-800/50 border border-white/[0.04]"
            >
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs text-slate-400">
                Difference of{' '}
                <span className="text-orange-400 font-semibold">
                  {(maxSpeed - avgSpeed).toFixed(1)} km/h
                </span>{' '}
                between mean and peak
              </span>
            </motion.div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

// ============================================
// CARD 3: ANOMALY DETECTION - TERMINAL TICKER
// ============================================
const AnomalyCard: React.FC<{
  data: AlertItem[] | null;
  loading: boolean;
}> = ({ data, loading }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return COLORS.neonRed;
      case 'medium':
        return COLORS.neonOrange;
      default:
        return COLORS.neonLime;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'CRITICAL';
      case 'medium':
        return 'WARNING';
      default:
        return 'NORMAL';
    }
  };

  return (
    <GlassCard delay={0.3} glowColor="rgba(255, 61, 113, 0.15)">
      <div className="relative z-10 p-6 sm:p-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: `linear-gradient(135deg, ${COLORS.neonRed}20, ${COLORS.neonRed}10)`,
            border: `1px solid ${COLORS.neonRed}30`,
          }}
        >
          <AlertTriangle className="w-7 h-7" style={{ color: COLORS.neonRed }} />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Anomaly Detection
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Automatic alerts about decreased performance and risk of injury through predictive AI.
        </p>

        <div className="relative mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-slate-950/60 border border-white/[0.06] border-b-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[10px] text-slate-600 font-mono ml-2">alerts.live</span>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ml-auto flex items-center gap-1"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-500 font-mono">LIVE</span>
            </motion.div>
          </div>

          <div className="relative p-3 rounded-b-lg bg-slate-950/40 border border-white/[0.06] min-h-[160px]">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonPulse className="w-2 h-2 rounded-full" />
                    <SkeletonPulse className="flex-1 h-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <AnimatePresence>
                  {data?.map((alert, idx) => (
                    <motion.div
                      key={idx}
                      custom={idx}
                      variants={tickerVariants}
                      initial="hidden"
                      animate="visible"
                      className="group flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/40 border border-white/[0.04] hover:border-red-500/20 hover:bg-red-500/[0.03] transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative flex-shrink-0">
                        <motion.div
                          variants={pulseVariants}
                          animate="animate"
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: getSeverityColor(alert.severity) }}
                        />
                        <div
                          className="absolute inset-0 w-2.5 h-2.5 rounded-full blur-sm"
                          style={{ background: getSeverityColor(alert.severity), opacity: 0.5 }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-white truncate">
                            {alert.metric}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider"
                            style={{
                              background: `${getSeverityColor(alert.severity)}15`,
                              color: getSeverityColor(alert.severity),
                            }}
                          >
                            {getSeverityLabel(alert.severity)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-3 h-3 text-red-400" />
                          <span className="text-sm font-bold text-red-400">
                            -{alert.dropPercent.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-600">drop detected</span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-b-lg">
              <motion.div
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// ============================================
// NAVIGATION COMPONENT
// ============================================
const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Technology', href: '#tech' },
    { name: 'Dashboard', href: 'dashboard' },
  ];
  
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2"
          >
            <img src={fvlogo} alt="FieldVision Logo" className="w-28 h-28" />
          </motion.div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
                whileHover={{ y: -2 }}
              >
                {link.name}
              </motion.a>
            ))}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-slate-300 p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="md:hidden overflow-hidden bg-slate-950/95 backdrop-blur-xl border-b border-slate-800"
      >
        <div className="px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="block py-2 text-slate-300 hover:text-emerald-400 font-medium"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <button className="w-full mt-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold">
            Acessar Plataforma
          </button>
        </div>
      </motion.div>
    </motion.nav>
  );
};

// ============================================
// HERO SECTION
// ============================================
const HeroSection: React.FC = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Animated tactical network */}
      <div className="absolute inset-0 opacity-60">
        <TacticalNetworkBackground />
      </div>
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,230,118,0.08)_0%,_transparent_70%)]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      
      {/* Floating decorative elements */}
      <motion.div 
        style={{ y: y2 }}
        className="absolute top-20 left-10 sm:left-20 opacity-20"
      >
        <div className="w-32 h-32 sm:w-48 sm:h-48 border border-emerald-500/30 rounded-full animate-pulse" />
      </motion.div>
      <motion.div 
        style={{ y: y1 }}
        className="absolute bottom-32 right-10 sm:right-32 opacity-20"
      >
        <div className="w-24 h-24 sm:w-40 sm:h-40 border border-cyan-500/30 rounded-full" />
      </motion.div>
      
      {/* Content */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6 sm:mb-8"
        >
          <Zap className="w-4 h-4" />
          <span>Powered by Neural Networks & Computer Vision</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-4 sm:mb-6 leading-tight"
        >
          Field Vision:
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Athlete Performance Analytics
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
        >
          
Predictive analysis of physical performance in real time.

Transform data into tactical decisions with millimeter precision.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0,230,118,0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-lg shadow-xl shadow-emerald-500/20 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Platform
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-full border border-slate-700 text-slate-300 font-semibold text-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-colors backdrop-blur-sm"
          >
            Preview
          </motion.button>
        </motion.div>
        
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 sm:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-3xl mx-auto"
        >
          {[
            { value: "98%", label: "Prediction Accuracy" },
            { value: "50ms", label: "Data Latency" },
            { value: "200+", label: "Metrics Analyzed" },
            { value: "24/7", label: "Monitoring" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-emerald-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

// ============================================
// FEATURES SECTION
// ============================================
const FeaturesSection: React.FC = () => {
 const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<PreviewData>('/previews')
      .then((response) => {
        setPreviewData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Erro ao carregar previews.');
        setLoading(false);
      });
  }, []);

  return (
    <section
      id="features"
      className="relative py-24 sm:py-32 bg-slate-950 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,212,255,0.05)_0%,_transparent_50%)]" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 sm:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4"
          >
            <Activity className="w-4 h-4" />
            Real-Time Micro-Visualizations
          </motion.div>

          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
            Three Pillars of{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Performance
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Real-time data from your roster, transformed into instant visual insights.
            Cutting-edge technology to elevate physical preparation to the highest level.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
          >
            <ShieldAlert className="w-5 h-5 mx-auto mb-2" />
            {error}
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-3 gap-6 sm:gap-8"
        >
          <ProfileCard
            data={previewData?.profiles || null}
            loading={loading}
          />
          <ComparisonCard
            data={previewData?.comparison || null}
            loading={loading}
          />
          <AnomalyCard
            data={previewData?.recentAlerts || null}
            loading={loading}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-300 text-sm mb-4">
            Feel tempted about the full experience? Access the complete dashboard with in-depth analytics, customizable views, and real-time monitoring tools.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,230,118,0.2)' }}
            whileTap={{ scale: 0.95 }}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
          >
            Access Complete Dashboard
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// TECH SHOWCASE SECTION
// ============================================
const TechShowcase: React.FC = () => {
  return (
    <section id="tech" className="relative py-24 sm:py-32 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,230,118,0.05)_0%,_transparent_50%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
              <LineChart className="w-4 h-4" />
              Technology
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
              Real-time{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Analysis
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Our AI engine processes various sets and types of data in milliseconds. 
            We identify patterns and translate them into actionable insights for the 
            technical committee.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Radar, text: "Sub-meter Position Tracking" },
                { icon: TrendingUp, text: "Performance Peak Prediction" },
                { icon: Shield, text: "Injury Prevention through Overload Detection" },
                { icon: BarChart3, text: "Customizable Dashboards by Position" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 text-slate-300"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800 backdrop-blur-sm p-6 sm:p-8 shadow-2xl">
              {/* Mock Dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="text-xs text-slate-500 font-mono">fieldvision/dashboard</div>
                </div>
                
                {/* Chart Bars */}
                <div className="grid grid-cols-7 gap-2 h-40 items-end">
                  {[65, 40, 85, 55, 90, 70, 95].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                      className="rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-80 hover:opacity-100 transition-opacity"
                    />
                  ))}
                </div>
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[
                    { label: "Distance", value: "10.2km", trend: "+5%" },
                    { label: "Sprints", value: "24", trend: "+12%" },
                    { label: "Avg HR", value: "165bpm", trend: "-3%" }
                  ].map((stat, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                      <div className="text-lg font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-emerald-400">{stat.trend}</div>
                    </div>
                  ))}
                </div>
                
                {/* Progress Bars */}
                <div className="space-y-3 mt-4">
                  {[
                    { label: "Intensity", value: 85, color: "bg-emerald-500" },
                    { label: "Recovery", value: 72, color: "bg-cyan-500" },
                    { label: "Injury Risk", value: 15, color: "bg-red-500" }
                  ].map((bar, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{bar.label}</span>
                        <span className="text-white">{bar.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${bar.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
                          className={`h-full rounded-full ${bar.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-2xl opacity-20 -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// FOOTER
// ============================================
const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-32 h-32 rounded-lg flex items-center justify-center">
              <img src={fvicon} alt="FieldVision Logo" className="w-full h-full" />
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Contact</a>
          </div>
          
          <div className="text-sm text-slate-600">
            © 2026 FieldVision. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
const App: React.FC = () => {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-emerald-500/30">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <TechShowcase />
      <Footer />
    </div>
  );
};

export default App;
