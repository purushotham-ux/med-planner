import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from './ui/Modal';
import { toast } from '../stores/toastStore';
import api from '../lib/api';
import type { Doctor, Brand, ApiResponse } from '../types';
import { SPECIALITY_LABELS, GRADE_COLORS } from '../types';
import {
  Check, SkipForward, Clock, Package,
  CalendarPlus, Loader2, FileText, Pill, Search, Hash, X, StickyNote
} from 'lucide-react';

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45];

const QUICK_NOTES = [
  'Detailed discussion done',
  'Doctor was busy, met assistant',
  'Sample given',
  'Positive feedback',
  'Needs follow-up',
  'Literature left',
  'Doctor not available',
  'Reminder visit',
];

interface VisitRecordModalProps {
  open: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  planItemId?: string;
  planId?: string;
  mode?: 'visit' | 'skip';
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '12px',
  backgroundColor: '#0a0a0f',
  border: '1px solid rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: '14.5px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box' as const,
};

export function VisitRecordModal({
  open, onClose, doctor, planItemId, planId, mode = 'visit',
}: VisitRecordModalProps) {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState('');
  const [brandsPromoted, setBrandsPromoted] = useState<string[]>([]);
  const [brandsWritten, setBrandsWritten] = useState<string[]>([]);
  const [doctorFeedback, setDoctorFeedback] = useState('');
  const [followUpBrand, setFollowUpBrand] = useState('');
  const [rxCommitment, setRxCommitment] = useState<string>('');
  const [duration, setDuration] = useState(15);
  const [followUpDays, setFollowUpDays] = useState<number | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Brand[]>>('/brands');
      return data.data;
    },
    enabled: open,
  });

  const brandsByCategory = useMemo(() => {
    const groups = new Map<string, Brand[]>();
    const filtered = brandSearch
      ? brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
      : brands;
    filtered.forEach(b => {
      const cat = b.category || 'Other';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(b);
    });
    return groups;
  }, [brands, brandSearch]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!doctor) return;
      if (mode === 'visit') {
        const followUpDate = followUpDays
          ? new Date(Date.now() + followUpDays * 86400000).toISOString()
          : undefined;
        await api.post('/visits', {
          doctorId: doctor.id,
          visitDate: new Date().toISOString(),
          completed: true,
          remarks: remarks || undefined,
          products: brandsPromoted,
          brandsPromoted,
          brandsWritten,
          doctorFeedback: doctorFeedback || undefined,
          followUpBrand: followUpBrand || undefined,
          rxCommitment: rxCommitment ? parseInt(rxCommitment) : undefined,
          duration,
          followUpDate,
          planItemId: planItemId || undefined,
        });
        if (planId && planItemId) {
          await api.put(`/plans/${planId}/items/${planItemId}`, { status: 'VISITED' });
        }
        toast.success(`Visit to ${doctor.name} recorded!`);
      } else {
        if (planId && planItemId) {
          await api.put(`/plans/${planId}/items/${planItemId}`, { status: 'SKIPPED' });
        }
        await api.post('/visits', {
          doctorId: doctor.id,
          visitDate: new Date().toISOString(),
          skipped: true,
          skipReason: skipReason || undefined,
          completed: false,
        });
        toast.info(`Skipped ${doctor.name}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      resetForm();
      onClose();
    },
    onError: () => toast.error('Failed to record visit'),
  });

  const resetForm = () => {
    setRemarks('');
    setBrandsPromoted([]);
    setBrandsWritten([]);
    setDoctorFeedback('');
    setFollowUpBrand('');
    setRxCommitment('');
    setDuration(15);
    setFollowUpDays(null);
    setSkipReason('');
    setBrandSearch('');
    setShowAdvanced(false);
  };

  const toggleBrand = (name: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(name) ? list.filter(x => x !== name) : [...list, name]);
  };

  const addQuickNote = (note: string) => {
    setRemarks(prev => prev ? `${prev}. ${note}` : note);
  };

  if (!doctor) return null;

  const gradeColor = GRADE_COLORS[doctor.grade as keyof typeof GRADE_COLORS] || '#aaa';

  return (
    <Modal open={open} onClose={onClose} title={mode === 'visit' ? 'Log Visit Record' : 'Skip Visit'} size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '8px' }}>
        
        {/* Doctor Info Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${gradeColor}15`, color: gradeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, flexShrink: 0 }}>
            {doctor.grade}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doctor.name}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#8e8e9e' }}>{SPECIALITY_LABELS[doctor.speciality as keyof typeof SPECIALITY_LABELS]}</p>
          </div>
          <div style={{ padding: '4px 12px', borderRadius: '8px', backgroundColor: `${gradeColor}15`, color: gradeColor, fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
            {doctor.visitFrequency || 2}V/mo
          </div>
        </div>

        {mode === 'visit' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Visit Notes */}
            <div style={{ backgroundColor: '#141418', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginBottom: '16px' }}>
                <StickyNote size={16} /> Visit Discussion & Notes
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {QUICK_NOTES.map(note => (
                  <button key={note} type="button" onClick={() => addQuickNote(note)} style={{
                    padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#b0b0bc',
                    border: '1px solid transparent', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    {note}
                  </button>
                ))}
              </div>
              <textarea
                value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="What happened during the visit? Key discussion points..."
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              />
            </div>

            {/* Duration */}
            <div style={{ backgroundColor: '#141418', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#34d399', marginBottom: '16px' }}>
                <Clock size={16} /> Visit Duration
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {DURATION_PRESETS.map(d => {
                  const isSelected = duration === d;
                  return (
                    <button key={d} type="button" onClick={() => setDuration(d)} style={{
                      padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                      backgroundColor: isSelected ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#34d399' : '#8e8e9e'
                    }}>
                      {d} min
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brands Promoted */}
            <div style={{ backgroundColor: '#141418', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#60a5fa', marginBottom: '16px' }}>
                <Package size={16} /> Products / Brands Promoted
              </label>
              
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={16} color="#8e8e9e" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" value={brandSearch} onChange={e => setBrandSearch(e.target.value)}
                  placeholder="Search products or SKUs..." 
                  style={{ ...inputStyle, paddingLeft: '44px', paddingRight: '44px' }} 
                />
                {brandSearch && (
                  <button onClick={() => setBrandSearch('')} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: 'transparent', border: 'none', color: '#8e8e9e', cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}>
                    <X size={16} />
                  </button>
                )}
              </div>

              {brandsPromoted.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(96,165,250,0.05)', borderRadius: '12px' }}>
                  {brandsPromoted.map(b => (
                    <button key={`sel-${b}`} type="button" onClick={() => toggleBrand(b, brandsPromoted, setBrandsPromoted)} style={{
                      padding: '6px 12px', borderRadius: '8px', backgroundColor: '#60a5fa', color: '#fff', fontSize: '12px', fontWeight: 700,
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      {b} <X size={12} strokeWidth={3} />
                    </button>
                  ))}
                </div>
              )}

              <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Array.from(brandsByCategory.entries()).map(([cat, items]) => (
                  <div key={cat}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 800, color: '#5a5a68', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {items.map(b => {
                        const isSelected = brandsPromoted.includes(b.name);
                        return (
                          <button key={b.id} type="button" onClick={() => toggleBrand(b.name, brandsPromoted, setBrandsPromoted)} style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s', border: 'none',
                            backgroundColor: isSelected ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                            color: isSelected ? '#60a5fa' : '#c2c2d6'
                          }}>
                            {b.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Feedback */}
            <div style={{ backgroundColor: '#141418', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#a855f7', marginBottom: '16px' }}>
                <FileText size={16} /> Doctor's Response / Commitment
              </label>
              <textarea
                value={doctorFeedback} onChange={e => setDoctorFeedback(e.target.value)}
                placeholder="What did the doctor say? Any specific commitments?"
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            {/* Follow Up */}
            <div style={{ backgroundColor: '#141418', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#f87171', marginBottom: '16px' }}>
                <CalendarPlus size={16} /> Follow-up Reminder
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: followUpDays && brandsPromoted.length > 0 ? '16px' : 0 }}>
                {[{ v: null, l: 'None' }, { v: 3, l: '3 days' }, { v: 7, l: '7 days' }, { v: 14, l: '14 days' }, { v: 30, l: '1 month' }].map(d => {
                  const isSelected = followUpDays === d.v;
                  return (
                    <button key={String(d.v)} type="button" onClick={() => setFollowUpDays(d.v)} style={{
                      padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                      backgroundColor: isSelected ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#f87171' : '#8e8e9e'
                    }}>
                      {d.l}
                    </button>
                  );
                })}
              </div>
              
              {followUpDays !== null && brandsPromoted.length > 0 && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#8e8e9e' }}>Follow-up for which specific product?</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {brandsPromoted.map(b => {
                      const isSelected = followUpBrand === b;
                      return (
                        <button key={b} type="button" onClick={() => setFollowUpBrand(isSelected ? '' : b)} style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                          backgroundColor: isSelected ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#f87171' : '#c2c2d6'
                        }}>
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Toggle */}
            <div style={{ backgroundColor: '#141418', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{
                width: '100%', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: 0
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill size={16} color="#34d399" /> Advanced Rx Details
                </span>
                <span style={{ color: '#8e8e9e', fontSize: '20px' }}>{showAdvanced ? '−' : '+'}</span>
              </button>
              
              {showAdvanced && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '12px' }}>
                      Products Doctor Actually Prescribed
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {brandsPromoted.length > 0 ? brandsPromoted.map(b => {
                        const isSelected = brandsWritten.includes(b);
                        return (
                          <button key={`wr-${b}`} type="button" onClick={() => toggleBrand(b, brandsWritten, setBrandsWritten)} style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                            backgroundColor: isSelected ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                            color: isSelected ? '#34d399' : '#c2c2d6'
                          }}>
                            {b}
                          </button>
                        );
                      }) : (
                        <p style={{ margin: 0, fontSize: '12px', color: '#5a5a68', fontStyle: 'italic' }}>Please select promoted products first.</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>
                      Number of Prescriptions (Rx) Expected
                    </label>
                    <input type="number" value={rxCommitment} onChange={e => setRxCommitment(e.target.value)}
                      placeholder="e.g. 5" style={{ ...inputStyle, width: '120px' }} min={0} />
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Skip mode */
          <div style={{ backgroundColor: '#141418', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#f87171' }}>Reason for Skipping</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {['Busy', 'Not Available', 'Ex-Station', 'Closed', 'Rescheduled', 'Other'].map(r => {
                const isSelected = skipReason === r;
                return (
                  <button key={r} type="button" onClick={() => setSkipReason(r)} style={{
                    padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                    backgroundColor: isSelected ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#f87171' : '#8e8e9e'
                  }}>
                    {r}
                  </button>
                );
              })}
            </div>
            <textarea
              value={skipReason === 'Other' ? '' : skipReason}
              onChange={e => setSkipReason(e.target.value)}
              placeholder="Provide specific details..."
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{
            width: '100%', padding: '18px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            background: mode === 'visit' ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' : 'rgba(248,113,113,0.1)',
            color: mode === 'visit' ? '#fff' : '#f87171', fontSize: '16px', fontWeight: 700, border: 'none', marginTop: '8px',
            cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1,
            boxShadow: mode === 'visit' ? '0 8px 24px rgba(245,158,11,0.2)' : 'none'
          }}
        >
          {mutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : mode === 'visit' ? (
            <><Check size={20} strokeWidth={2.5} /> Save Visit Record</>
          ) : (
            <><SkipForward size={20} strokeWidth={2.5} /> Skip Visit</>
          )}
        </button>

      </div>
    </Modal>
  );
}
