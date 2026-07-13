import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Doctor, ApiResponse } from '../types';
import { getSpecialityLabel, getSpecialityColor, GRADE_COLORS, DAYS_OF_WEEK } from '../types';
import { VisitRecordModal } from '../components/VisitRecordModal';
import {
  Search, Plus, Star, MapPin, Phone, Clock, SortAsc,
  Building2, Pill as PillIcon, Filter, X, Check, FileDown
} from 'lucide-react';

type SortOption = 'name' | 'grade' | 'area' | 'speciality' | 'visitFrequency';

export function DoctorsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [specFilter, setSpecFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [visitDoctor, setVisitDoctor] = useState<Doctor | null>(null);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '500' });
      if (search) params.set('search', search);
      const { data } = await api.get<ApiResponse<Doctor[]>>(`/doctors?${params}`);
      return data.data;
    },
  });

  const isAvailableNow = (doc: Doctor): boolean => {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const day = now.getDay();
    if (doc.exStationDays?.includes(day)) return false;
    if (doc.morningStart && doc.morningEnd && t >= doc.morningStart && t <= doc.morningEnd) return true;
    if (doc.afternoonStart && doc.afternoonEnd && t >= doc.afternoonStart && t <= doc.afternoonEnd) return true;
    if (doc.eveningStart && doc.eveningEnd && t >= doc.eveningStart && t <= doc.eveningEnd) return true;
    return false;
  };

  const getCurrentTiming = (doc: Doctor): string | null => {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (doc.morningStart && doc.morningEnd && t >= doc.morningStart && t <= doc.morningEnd) return `${doc.morningStart}–${doc.morningEnd}`;
    if (doc.afternoonStart && doc.afternoonEnd && t >= doc.afternoonStart && t <= doc.afternoonEnd) return `${doc.afternoonStart}–${doc.afternoonEnd}`;
    if (doc.eveningStart && doc.eveningEnd && t >= doc.eveningStart && t <= doc.eveningEnd) return `${doc.eveningStart}–${doc.eveningEnd}`;
    return null;
  };

  const getTimingSlots = (doc: Doctor): { label: string; time: string }[] => {
    const slots: { label: string; time: string }[] = [];
    if (doc.morningStart && doc.morningEnd) slots.push({ label: 'M', time: `${doc.morningStart}–${doc.morningEnd}` });
    if (doc.afternoonStart && doc.afternoonEnd) slots.push({ label: 'A', time: `${doc.afternoonStart}–${doc.afternoonEnd}` });
    if (doc.eveningStart && doc.eveningEnd) slots.push({ label: 'E', time: `${doc.eveningStart}–${doc.eveningEnd}` });
    return slots;
  };

  const areas = useMemo(() => {
    const m = new Map<string, string>();
    doctors.forEach(d => { if (d.area) m.set(d.area.id, d.area.name); });
    return Array.from(m, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [doctors]);

  const specialities = useMemo(() => {
    const s = new Set<string>();
    doctors.forEach(d => s.add(d.speciality));
    return Array.from(s).sort();
  }, [doctors]);

  const filtered = useMemo(() => {
    let list = [...doctors];
    if (gradeFilter) list = list.filter(d => d.grade === gradeFilter);
    if (areaFilter) list = list.filter(d => d.areaId === areaFilter);
    if (specFilter) list = list.filter(d => d.speciality === specFilter);
    list.sort((a, b) => {
      switch (sortBy) {
        case 'grade': return a.grade.localeCompare(b.grade);
        case 'area': return (a.area?.name || '').localeCompare(b.area?.name || '');
        case 'speciality': return a.speciality.localeCompare(b.speciality);
        case 'visitFrequency': return (b.visitFrequency || 0) - (a.visitFrequency || 0);
        default: return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [doctors, gradeFilter, areaFilter, specFilter, sortBy]);

  const activeFilterCount = [gradeFilter, areaFilter, specFilter].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0f' }}>
      
      {/* Sticky Header Area */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: 'min(5vw, 24px) min(5vw, 24px) 16px min(5vw, 24px)', maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Doctors Directory</h1>
              <p style={{ fontSize: '13px', color: '#8e8e9e', margin: 0, fontWeight: 500 }}>{filtered.length} of {doctors.length} doctors</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => navigate('/doctors/import')} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <FileDown size={16} /> Import
              </button>
              <button onClick={() => navigate('/doctors/new')} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', border: 'none', color: '#fff',
                fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.2)'
              }}>
                <Plus size={16} strokeWidth={2.5} /> Add New
              </button>
            </div>
          </div>

          {/* Search & Basic Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a68', pointerEvents: 'none' }}>
                <Search size={18} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, hospital, area, pharmacy..."
                style={{
                  width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', backgroundColor: '#141418',
                  border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '14.5px', outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.05)'}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: '#8e8e9e', cursor: 'pointer'
                }}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              <button onClick={() => setShowFilters(!showFilters)} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '99px', flexShrink: 0,
                backgroundColor: activeFilterCount > 0 ? 'rgba(245,158,11,0.1)' : '#141418',
                color: activeFilterCount > 0 ? '#f59e0b' : '#8e8e9e',
                border: activeFilterCount > 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.05)',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <Filter size={14} />
                {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
              </button>

              {['A', 'B', 'C'].map(g => (
                <button key={g} onClick={() => setGradeFilter(gradeFilter === g ? '' : g)} style={{
                  padding: '8px 16px', borderRadius: '99px', flexShrink: 0, fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                  backgroundColor: gradeFilter === g ? `${GRADE_COLORS[g as keyof typeof GRADE_COLORS]}20` : '#141418',
                  color: gradeFilter === g ? GRADE_COLORS[g as keyof typeof GRADE_COLORS] : '#8e8e9e',
                  border: gradeFilter === g ? `1px solid ${GRADE_COLORS[g as keyof typeof GRADE_COLORS]}50` : '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.2s'
                }}>
                  Grade {g}
                </button>
              ))}

              <div style={{ position: 'relative', flexShrink: 0 }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} style={{
                  appearance: 'none', padding: '8px 32px 8px 16px', borderRadius: '99px',
                  backgroundColor: '#141418', color: '#8e8e9e', border: '1px solid rgba(255,255,255,0.05)',
                  fontWeight: 600, fontSize: '13px', outline: 'none', cursor: 'pointer'
                }}>
                  <option value="name">Sort by Name</option>
                  <option value="grade">Sort by Grade</option>
                  <option value="area">Sort by Area</option>
                  <option value="speciality">Sort by Speciality</option>
                  <option value="visitFrequency">Sort by Frequency</option>
                </select>
                <SortAsc size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a68', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div style={{ display: 'flex', gap: '16px', padding: '16px', backgroundColor: '#141418', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Area</label>
                  <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#0a0a0f', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', outline: 'none' }}>
                    <option value="">All Areas</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Speciality</label>
                  <select value={specFilter} onChange={(e) => setSpecFilter(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#0a0a0f', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', outline: 'none' }}>
                    <option value="">All Specialities</option>
                    {specialities.map(s => <option key={s} value={s}>{getSpecialityLabel(s)}</option>)}
                  </select>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Main List Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'min(5vw, 24px)', paddingBottom: '100px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ height: '180px', backgroundColor: '#141418', borderRadius: '20px', opacity: 0.5 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#5a5a68' }}>
              <Search size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', color: '#8e8e9e' }}>No doctors found</p>
              <p style={{ fontSize: '13px', margin: 0 }}>Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
              {filtered.map(doc => {
                const available = isAvailableNow(doc);
                const currentTiming = getCurrentTiming(doc);
                const timingSlots = getTimingSlots(doc);
                const vf = doc.visitFrequency || (doc.grade === 'A' ? 3 : doc.grade === 'B' ? 2 : 1);
                const gradeColor = GRADE_COLORS[doc.grade as keyof typeof GRADE_COLORS] || '#aaa';
                const specColor = getSpecialityColor(doc.speciality);

                return (
                  <div key={doc.id} onClick={() => navigate(`/doctors/${doc.id}`)} style={{
                    backgroundColor: '#121216', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                  }}>
                    {/* Hover Glow */}
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top right, ${gradeColor}10, transparent 60%)`, pointerEvents: 'none' }} />
                    
                    {/* Top Row: Grade & Name */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: 800, backgroundColor: `${gradeColor}15`, color: gradeColor, position: 'relative'
                      }}>
                        {doc.grade}
                        {available && <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#34d399', border: '2px solid #121216' }} />}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</h3>
                          {doc.favorite && <Star size={14} color="#f59e0b" fill="#f59e0b" style={{ flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: specColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getSpecialityLabel(doc.speciality)} {doc.notes && <span style={{ color: '#5a5a68', fontWeight: 500 }}> • {doc.notes}</span>}
                        </div>
                      </div>
                      
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 800, backgroundColor: `${gradeColor}10`, color: gradeColor
                      }}>
                        {vf}V
                      </div>
                    </div>

                    {/* Info Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                      {doc.area && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#8e8e9e', fontWeight: 500 }}>
                          <MapPin size={12} color="#5a5a68" /> {doc.area.name}
                        </div>
                      )}
                      {doc.hospital && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#8e8e9e', fontWeight: 500 }}>
                          <Building2 size={12} color="#5a5a68" /> {doc.hospital}
                        </div>
                      )}
                      {doc.chemist && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#8e8e9e', fontWeight: 500 }}>
                          <PillIcon size={12} color="#5a5a68" /> {doc.chemist.pharmacyName || doc.chemist.name}
                        </div>
                      )}
                    </div>

                    {/* Timings */}
                    <div style={{ marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                      {available && currentTiming ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                          <Clock size={12} /> Available Now: {currentTiming}
                        </span>
                      ) : timingSlots.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {timingSlots.map(slot => (
                            <span key={slot.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.03)', color: '#8e8e9e' }}>
                              <Clock size={10} color="#5a5a68" /> {slot.label}: {slot.time}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#5a5a68', fontWeight: 500 }}>
                          <Clock size={12} /> No timings set
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Days + Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {DAYS_OF_WEEK.slice(1).map((day, idx) => {
                          const dayIdx = idx + 1;
                          const isPref = doc.preferredDays?.includes(dayIdx);
                          return (
                            <span key={dayIdx} style={{
                              width: '22px', height: '22px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 700, backgroundColor: isPref ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                              color: isPref ? '#f59e0b' : '#5a5a68'
                            }}>
                              {day[0]}
                            </span>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); setVisitDoctor(doc); }} style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none',
                          backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                        }}>
                          <Check size={14} strokeWidth={2.5} /> Visit
                        </button>
                        {doc.phone && (
                          <a href={`tel:${doc.phone}`} onClick={e => e.stopPropagation()} style={{
                            width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', textDecoration: 'none'
                          }}>
                            <Phone size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <VisitRecordModal open={!!visitDoctor} onClose={() => setVisitDoctor(null)} doctor={visitDoctor} mode="visit" />
    </div>
  );
}
