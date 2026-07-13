import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { toast } from '../stores/toastStore';
import { VisitRecordModal } from '../components/VisitRecordModal';
import type { Plan, ApiResponse, Doctor } from '../types';
import { getSpecialityLabel, GRADE_COLORS, DAYS_OF_WEEK } from '../types';
import {
  CalendarDays, Sparkles, Check, Clock, MapPin,
  Navigation2, Loader2, SkipForward, Route, ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';

// Progress Ring
function ProgressRing({ percentage, size = 70, stroke = 6 }: { percentage: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#planGrad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
        <defs>
          <linearGradient id="planGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{percentage}%</span>
      </div>
    </div>
  );
}

export function PlanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Visit modal state
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitDoctor, setVisitDoctor] = useState<Doctor | null>(null);
  const [visitItemId, setVisitItemId] = useState<string>('');
  const [visitMode, setVisitMode] = useState<'visit' | 'skip'>('visit');

  // Fetch plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans', selectedDate],
    queryFn: async () => {
      const from = new Date(selectedDate); from.setHours(0, 0, 0, 0);
      const to = new Date(selectedDate); to.setHours(23, 59, 59, 999);
      const { data } = await api.get<ApiResponse<Plan[]>>(
        `/plans?from=${from.toISOString()}&to=${to.toISOString()}`,
      );
      return data.data;
    },
  });

  const currentPlan = plans?.[0];

  // Stats
  const totalItems = currentPlan?.items.length || 0;
  const visitedCount = currentPlan?.items.filter((i) => i.status === 'VISITED').length || 0;
  const pendingCount = currentPlan?.items.filter((i) => i.status === 'PENDING').length || 0;
  const skippedCount = currentPlan?.items.filter((i) => i.status === 'SKIPPED').length || 0;
  const percentage = totalItems > 0 ? Math.round((visitedCount / totalItems) * 100) : 0;

  // Generate plan
  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      let latitude: number | undefined, longitude: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch { /* no location */ }

      await api.post('/plans/generate', { date: selectedDate, maxDoctors: 15, latitude, longitude });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Plan generated successfully!');
    } catch {
      toast.error('Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  // Optimize route via OSRM
  const optimizeRoute = async () => {
    if (!currentPlan?.items.length) return;
    setIsOptimizing(true);
    try {
      const pendingItems = currentPlan.items.filter((i) => i.status === 'PENDING');
      const coords = pendingItems
        .filter((i) => i.doctor?.latitude && i.doctor?.longitude)
        .map((i) => ({ id: i.id, lat: i.doctor!.latitude!, lng: i.doctor!.longitude! }));

      if (coords.length < 2) {
        toast.info('Need at least 2 locations to optimize');
        return;
      }

      // Call OSRM optimize
      const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(';');
      const { data } = await api.get(`/geocode/optimize?coordinates=${coordStr}`);

      if (data.data?.distance) {
        toast.success(`Route optimized! ${(data.data.distance / 1000).toFixed(1)}km, ~${Math.round(data.data.duration / 60)} min`);
      }
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch {
      toast.error('Route optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Navigate all pending
  const navigateAll = () => {
    if (!currentPlan) return;
    const pending = currentPlan.items
      .filter((i) => i.status === 'PENDING' && i.doctor?.latitude && i.doctor?.longitude);
    if (pending.length === 0) return;

    // Google Maps multi-stop: first as origin, rest as waypoints, last as destination
    const points = pending.map((i) => `${i.doctor!.latitude},${i.doctor!.longitude}`);
    if (points.length === 1) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${points[0]}&travelmode=driving`, '_blank');
    } else {
      const dest = points[points.length - 1];
      const waypoints = points.slice(0, -1).join('|');
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&waypoints=${waypoints}&travelmode=driving`, '_blank');
    }
  };

  // Open visit modal
  const openVisitModal = (doctor: Doctor, itemId: string, mode: 'visit' | 'skip') => {
    setVisitDoctor(doctor);
    setVisitItemId(itemId);
    setVisitMode(mode);
    setVisitModalOpen(true);
  };

  // Navigate single doctor
  const handleNavigate = (doctor: Doctor) => {
    if (doctor.latitude && doctor.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${doctor.latitude},${doctor.longitude}&travelmode=driving`, '_blank');
    }
  };

  // Week dates
  const getWeekDates = () => {
    const today = new Date();
    const dates: Date[] = [];
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Daily Plan</h1>
          <div className="flex items-center gap-2">
            {currentPlan && (
              <button
                onClick={optimizeRoute}
                disabled={isOptimizing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-800/60 border border-navy-700/30 text-navy-300 text-xs font-medium compact-touch hover:bg-navy-800 transition-colors"
              >
                {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Route size={12} />}
                Optimize
              </button>
            )}
            <button
              onClick={generatePlan}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2.5 gradient-teal rounded-xl text-white text-sm font-semibold shadow-lg shadow-teal-500/20 compact-touch"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate
            </button>
          </div>
        </div>

        {/* Week selector */}
        <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
          {weekDates.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={clsx(
                  'flex flex-col items-center px-3 py-2.5 rounded-xl min-w-[50px] transition-all compact-touch shrink-0',
                  isSelected
                    ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400'
                    : isToday
                    ? 'bg-navy-800/60 border border-navy-600/30 text-white'
                    : 'bg-navy-800/30 text-navy-500 border border-transparent',
                )}
              >
                <span className="text-[10px] font-medium uppercase">{DAYS_OF_WEEK[date.getDay()]}</span>
                <span className={clsx('text-lg font-bold', isSelected ? 'text-teal-400' : '')}>{date.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Plan summary bar */}
        {currentPlan && (
          <div className="flex items-center gap-3.5 mb-3 p-3.5 glass rounded-xl">
            <ProgressRing percentage={percentage} size={52} stroke={5} />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-navy-300 truncate">{currentPlan.name}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                <span className="text-emerald-400">✓ {visitedCount}</span>
                <span className="text-amber-400">⏳ {pendingCount}</span>
                <span className="text-navy-500">⊘ {skippedCount}</span>
              </div>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={navigateAll}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-500/15 text-teal-400 text-xs font-medium compact-touch hover:bg-teal-500/25 transition-colors"
              >
                <ExternalLink size={11} />
                Navigate All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Plan Items */}
      <div className="flex-1 overflow-y-auto pb-nav">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-2xl" style={{ height: '100px' }} />)}
          </div>
        ) : !currentPlan ? (
          <div className="flex flex-col items-center justify-center py-20 text-navy-500">
            <CalendarDays size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">No plan for this day</p>
            <p className="text-xs mt-1 text-navy-600">Tap "Generate" to auto-create one</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-in">
            {currentPlan.items.map((item, idx) => (
              <div
                key={item.id}
                className={clsx(
                  'glass rounded-2xl p-4 transition-all',
                  item.status === 'VISITED' && 'opacity-60',
                  item.status === 'SKIPPED' && 'opacity-40',
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Order */}
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                      item.status === 'VISITED' ? 'bg-emerald-500/20 text-emerald-400' :
                      item.status === 'SKIPPED' ? 'bg-red-500/20 text-red-400' :
                      'bg-navy-700/50 text-navy-300',
                    )}
                  >
                    {item.status === 'VISITED' ? <Check size={16} /> :
                     item.status === 'SKIPPED' ? <SkipForward size={14} /> :
                     idx + 1}
                  </div>

                  {/* Doctor info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/doctors/${item.doctorId}`)}
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-white truncate">{item.doctor?.name}</p>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: GRADE_COLORS[item.doctor?.grade || 'B'] }}
                      />
                    </div>
                    <p className="text-[11px] text-navy-400 mt-0.5 truncate">
                      {item.doctor?.speciality ? getSpecialityLabel(item.doctor.speciality) : ''}
                      {item.doctor?.area?.name ? ` • ${item.doctor.area.name}` : ''}
                    </p>
                    {item.doctor?.hospital && (
                      <p className="text-[10px] text-navy-500 mt-0.5 truncate flex items-center gap-0.5">
                        <MapPin size={9} /> {item.doctor.hospital}
                      </p>
                    )}
                    {item.timeSlot && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-teal-400/70 mt-1">
                        <Clock size={9} /> {item.timeSlot.toLowerCase()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {item.status === 'PENDING' && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => openVisitModal(item.doctor, item.id, 'visit')}
                        className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 compact-touch hover:bg-emerald-500/25 transition-colors active:scale-90"
                        title="Record visit"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleNavigate(item.doctor)}
                        className="w-10 h-10 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-400 compact-touch hover:bg-teal-500/25 transition-colors active:scale-90"
                        title="Navigate"
                      >
                        <Navigation2 size={16} />
                      </button>
                      <button
                        onClick={() => openVisitModal(item.doctor, item.id, 'skip')}
                        className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400/60 compact-touch hover:bg-red-500/20 transition-colors active:scale-90"
                        title="Skip"
                      >
                        <SkipForward size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visit Record Modal */}
      <VisitRecordModal
        open={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        doctor={visitDoctor}
        planItemId={visitItemId}
        planId={currentPlan?.id}
        mode={visitMode}
      />
    </div>
  );
}
