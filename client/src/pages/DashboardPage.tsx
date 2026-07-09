import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { DashboardData, ApiResponse, Doctor } from '../types';
import { SPECIALITY_LABELS, GRADE_COLORS } from '../types';
import {
  Users, CalendarCheck, MapPin, Clock, Star,
  AlertTriangle, TrendingUp,
  Phone, Package, Plus
} from 'lucide-react';

function ProgressRing({ percentage, size = 64, stroke = 6 }: { percentage: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="url(#amberGrad)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <defs>
          <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{percentage}%</span>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard/today');
      return data.data;
    },
  });

  const { data: availableNow = [] } = useQuery({
    queryKey: ['doctors-available'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Doctor[]>>('/doctors/available-now');
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div style={{ padding: '24px', opacity: 0.5 }}>
        <div style={{ height: '32px', width: '150px', backgroundColor: '#1a1a20', borderRadius: '8px', marginBottom: '32px' }} />
        <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: '80px', width: '120px', backgroundColor: '#1a1a20', borderRadius: '12px' }} />)}
        </div>
      </div>
    );
  }

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good Morning' : today.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const pct = data?.planProgress?.percentage || 0;

  return (
    <div style={{ padding: 'min(5vw, 24px) min(5vw, 24px) 100px min(5vw, 24px)', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      
      {/* 1. Header Area */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#8e8e9e', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            {greeting}
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
            {today.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h1>
        </div>
        <button onClick={() => navigate('/plan')} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', border: 'none', color: '#fff',
          fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.2)'
        }}>
          <Plus size={16} strokeWidth={2.5} /> New Plan
        </button>
      </div>

      {/* 2. Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        <StatItem icon={<Users size={16}/>} label="Total Doctors" value={data?.stats.totalDoctors || 0} color="#f59e0b" onClick={() => navigate('/doctors')} />
        <StatItem icon={<CalendarCheck size={16}/>} label="Visited Today" value={data?.stats.todaysVisits || 0} color="#34d399" />
        <StatItem icon={<Star size={16}/>} label="Preferred" value={data?.stats.preferredToday || 0} color="#f97316" onClick={() => navigate('/doctors')} />
        <StatItem icon={<MapPin size={16}/>} label="Active" value={data?.stats.activeDoctors || 0} color="#60a5fa" onClick={() => navigate('/doctors')} />
        <StatItem icon={<AlertTriangle size={16}/>} label="Ex-Station" value={data?.stats.exStationToday || 0} color="#f87171" />
      </div>

      {/* 3. Main Content Split */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
        
        {/* Left Column: Today's Plan */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Plan Hero Card */}
          <div onClick={() => navigate('/plan')} style={{
            position: 'relative', padding: 'min(6vw, 28px)', borderRadius: '24px', cursor: 'pointer', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            background: 'linear-gradient(135deg, #1e1e24 0%, #121216 100%)', border: '1px solid rgba(52,211,153,0.1)'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'rgba(245,158,11,0.05)', borderRadius: '50%', filter: 'blur(50px)', transform: 'translate(30%, -30%)', pointerEvents: 'none' }} />
            
            {data?.plan ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 10 }}>
                <ProgressRing percentage={pct} size={72} stroke={6} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                    Active Plan
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.plan.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', fontWeight: 500 }}>
                    <span style={{ color: '#34d399' }}>{data.planProgress.completed} Visited</span>
                    <span style={{ color: '#fbbf24' }}>{data.planProgress.pending} Remaining</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 10 }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarCheck size={28} color="#f59e0b" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>No plan for today</h2>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#8e8e9e' }}>Tap to create your route</p>
                </div>
              </div>
            )}
          </div>

          {/* Next Up (If plan exists) */}
          {data?.plan?.items && data.plan.items.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e4e4ea', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <TrendingUp size={16} color="#f59e0b" /> Next Up
                </h3>
                <span onClick={() => navigate('/plan')} style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', cursor: 'pointer' }}>View All</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.plan.items.filter(item => item.status === 'PENDING').slice(0, 3).map((item, idx) => (
                  <DoctorListItem 
                    key={item.id} 
                    doctor={item.doctor!} 
                    prefix={<div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1a1a20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#8e8e9e' }}>{idx + 1}</div>}
                    onClick={() => navigate(`/doctors/${item.doctorId}`)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Lists */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Available Now */}
          {availableNow.length > 0 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e4e4ea', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.6)' }} />
                Available Right Now
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {availableNow.slice(0, 3).map(doc => (
                  <DoctorListItem 
                    key={doc.id} 
                    doctor={doc} 
                    onClick={() => navigate(`/doctors/${doc.id}`)}
                    action={doc.phone ? (
                      <a href={`tel:${doc.phone}`} onClick={e => e.stopPropagation()} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', textDecoration: 'none' }}>
                        <Phone size={14} />
                      </a>
                    ) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending Follow-ups */}
          {data?.pendingFollowups && data.pendingFollowups.length > 0 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e4e4ea', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
                <Clock size={16} color="#f59e0b" strokeWidth={2} /> Pending Follow-ups
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.pendingFollowups.slice(0, 3).map(v => (
                  <DoctorListItem 
                    key={v.id} 
                    doctor={v.doctor!} 
                    subtitle={v.followUpBrand ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}><Package size={10} /> {v.followUpBrand}</span> : undefined}
                    onClick={() => navigate(`/doctors/${v.doctorId}`)}
                    action={<span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{v.followUpDate ? new Date(v.followUpDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : ''}</span>}
                  />
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Helper Components 
   (Using inline styles guarantees perfect rendering independent of Tailwind)
   ========================================================================== */

function StatItem({ icon, label, value, color, onClick }: { icon: React.ReactNode; label: string; value: number; color: string; onClick?: () => void; }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#8e8e9e' }}>{label}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function DoctorListItem({ doctor, prefix, subtitle, action, onClick }: { doctor: any; prefix?: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; onClick?: () => void; }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px',
      background: '#121216', border: '1px solid rgba(255,255,255,0.02)', cursor: onClick ? 'pointer' : 'default'
    }}>
      {prefix}
      {!prefix && (
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, flexShrink: 0,
          backgroundColor: `${GRADE_COLORS[doctor.grade as keyof typeof GRADE_COLORS] || '#555'}15`,
          color: GRADE_COLORS[doctor.grade as keyof typeof GRADE_COLORS] || '#aaa'
        }}>
          {doctor.grade || '-'}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
          {doctor.name}
        </div>
        {subtitle || (
          <div style={{ fontSize: '12px', color: '#8e8e9e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {doctor.speciality ? SPECIALITY_LABELS[doctor.speciality as keyof typeof SPECIALITY_LABELS] : ''} • {doctor.area?.name || 'Unknown'}
          </div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0, marginLeft: '8px' }}>{action}</div>}
    </div>
  );
}
