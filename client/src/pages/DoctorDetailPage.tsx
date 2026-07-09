import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { toast } from '../stores/toastStore';
import { VisitRecordModal } from '../components/VisitRecordModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { Doctor, Visit, ApiResponse } from '../types';
import { SPECIALITY_LABELS, SPECIALITY_COLORS, GRADE_COLORS, DAYS_OF_WEEK } from '../types';
import {
  ArrowLeft, Heart, Phone, MapPin, Building2, Clock,
  Star, Navigation2, Calendar, Edit, Trash2, Check,
  MessageCircle, Pill, ExternalLink, FileText, Package,
  Hash, StickyNote, Save, MoreVertical
} from 'lucide-react';

export function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const toggleFavorite = useMutation({
    mutationFn: () => api.patch(`/doctors/${id}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const saveNotes = useMutation({
    mutationFn: (notes: string) => api.put(`/doctors/${id}`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', id] });
      setEditingNotes(false);
      toast.success('Notes saved');
    },
    onError: () => toast.error('Failed to save notes'),
  });

  const handleNavigate = () => {
    if (doctor?.googleMapsUrl) {
      window.open(doctor.googleMapsUrl, '_blank');
    } else if (doctor?.latitude && doctor?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${doctor.latitude},${doctor.longitude}&travelmode=driving`, '_blank');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/doctors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor deleted');
      navigate('/doctors', { replace: true });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const startEditNotes = () => {
    setNotesText(doctor?.notes || '');
    setEditingNotes(true);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ height: '40px', width: '120px', backgroundColor: '#141418', borderRadius: '12px' }} />
        <div style={{ height: '180px', width: '100%', backgroundColor: '#141418', borderRadius: '24px' }} />
        <div style={{ height: '300px', width: '100%', backgroundColor: '#141418', borderRadius: '24px' }} />
      </div>
    );
  }

  if (!doctor) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#8e8e9e' }}>Doctor not found</div>;
  }

  const vf = doctor.visitFrequency || (doctor.grade === 'A' ? 3 : doctor.grade === 'B' ? 2 : 1);
  const monthlyDone = doctor.monthlyVisitsDone || 0;
  const hasLocation = (doctor.latitude && doctor.longitude) || doctor.googleMapsUrl;
  const gradeColor = GRADE_COLORS[doctor.grade as keyof typeof GRADE_COLORS] || '#aaa';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0f', overflowY: 'auto' }}>
      
      {/* Top Navigation */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)',
        padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate(-1)} style={{
            width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)',
            border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <button onClick={() => toggleFavorite.mutate()} style={{
              width: '40px', height: '40px', borderRadius: '12px', backgroundColor: doctor.favorite ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
              border: 'none', color: doctor.favorite ? '#f87171' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <Heart size={20} fill={doctor.favorite ? '#f87171' : 'none'} />
            </button>
            <button onClick={() => navigate(`/doctors/${id}/edit`)} style={{
              width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)',
              border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <Edit size={20} />
            </button>
            <button onClick={() => setShowMenu(!showMenu)} style={{
              width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)',
              border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div style={{
                position: 'absolute', top: '50px', right: 0, backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px', padding: '8px', zIndex: 100, minWidth: '160px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}>
                <button onClick={() => { setShowMenu(false); setDeleteOpen(true); }} style={{
                  width: '100%', padding: '10px 12px', backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'none',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                }}>
                  <Trash2 size={16} /> Delete Doctor
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px md:24px', paddingBottom: '100px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '24px' }}>
          
          {/* Main Content Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Hero Profile Card */}
            <div style={{ 
              backgroundColor: '#121216', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.02)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: `radial-gradient(circle at top right, ${gradeColor}20, transparent 70%)`, pointerEvents: 'none' }} />
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', position: 'relative', zIndex: 10 }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: 800, backgroundColor: `${gradeColor}15`, color: gradeColor
                }}>
                  {doctor.grade}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 6px 0', lineHeight: 1.2 }}>{doctor.name}</h1>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: SPECIALITY_COLORS[doctor.speciality as keyof typeof SPECIALITY_COLORS] || '#aaa', marginBottom: '12px' }}>
                    {SPECIALITY_LABELS[doctor.speciality as keyof typeof SPECIALITY_LABELS]}
                    {doctor.notes && !editingNotes && <span style={{ color: '#8e8e9e', fontWeight: 500 }}> • {doctor.notes}</span>}
                  </div>
                  
                  {/* Visit Progress */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '4px 12px', borderRadius: '8px', backgroundColor: `${gradeColor}15`, color: gradeColor, fontSize: '12px', fontWeight: 800 }}>
                      {vf}V/month
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {Array.from({ length: vf }, (_, i) => (
                        <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i < monthlyDone ? '#34d399' : '#2a2a35' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#8e8e9e' }}>{monthlyDone}/{vf} done</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Log Visit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {doctor.phone && (
                  <a href={`tel:${doctor.phone}`} style={{
                    flex: '1 1 calc(33% - 8px)', minWidth: '100px', padding: '14px', borderRadius: '16px', backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 700
                  }}>
                    <Phone size={18} /> Call
                  </a>
                )}
                {doctor.phone && (
                  <a href={`https://wa.me/${doctor.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{
                    flex: '1 1 calc(33% - 8px)', minWidth: '100px', padding: '14px', borderRadius: '16px', backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 700
                  }}>
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                )}
                {hasLocation && (
                  <button onClick={handleNavigate} style={{
                    flex: '1 1 calc(33% - 8px)', minWidth: '100px', padding: '14px', borderRadius: '16px', backgroundColor: 'rgba(168,85,247,0.1)', color: '#a855f7',
                    border: 'none', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                  }}>
                    <Navigation2 size={18} /> Navigate
                  </button>
                )}
              </div>
              <button onClick={() => setVisitModalOpen(true)} style={{
                width: '100%', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                border: 'none', color: '#fff', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(245,158,11,0.2)'
              }}>
                <Check size={20} strokeWidth={2.5} /> Log Visit Record
              </button>
            </div>

            {/* Notes Inline Edit */}
            <div style={{ backgroundColor: '#121216', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StickyNote size={18} /> Doctor Notes
                </h2>
                {!editingNotes ? (
                  <button onClick={startEditNotes} style={{ backgroundColor: 'transparent', border: 'none', color: '#8e8e9e', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <Edit size={14} /> Edit
                  </button>
                ) : (
                  <button onClick={() => saveNotes.mutate(notesText)} disabled={saveNotes.isPending} style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#34d399', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <Save size={14} /> Save
                  </button>
                )}
              </div>
              {editingNotes ? (
                <textarea
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  placeholder="Add notes about this doctor..."
                  style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '12px', backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                  autoFocus
                />
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: doctor.notes ? '#e4e4ea' : '#5a5a68', lineHeight: 1.6, fontStyle: doctor.notes ? 'normal' : 'italic' }}>
                  {doctor.notes || 'No notes yet. Tap edit to add.'}
                </p>
              )}
            </div>

            {/* Details Profile */}
            <div style={{ backgroundColor: '#121216', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 20px 0' }}>Profile Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {doctor.hospital && <InfoRow icon={<Building2 size={16} />} label="Hospital" value={doctor.hospital} />}
                {doctor.clinic && <InfoRow icon={<Building2 size={16} />} label="Clinic" value={doctor.clinic} />}
                {doctor.area && <InfoRow icon={<MapPin size={16} />} label="Area" value={doctor.area.name} />}
                {doctor.beat && <InfoRow icon={<MapPin size={16} />} label="Beat" value={doctor.beat.name} />}
                {doctor.address && <InfoRow icon={<MapPin size={16} />} label="Address" value={doctor.address} />}
                {doctor.phone && <InfoRow icon={<Phone size={16} />} label="Phone" value={doctor.phone} />}
                {doctor.assistantName && <InfoRow icon={<Star size={16} />} label="Assistant" value={doctor.assistantName} />}
                {doctor.chemist && <InfoRow icon={<Pill size={16} />} label="Pharmacy" value={doctor.chemist.pharmacyName || doctor.chemist.name} />}
                {doctor.googleMapsUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#8e8e9e', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ExternalLink size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase' }}>Google Maps</p>
                      <a href={doctor.googleMapsUrl} target="_blank" rel="noreferrer" style={{ fontSize: '14px', fontWeight: 600, color: '#34d399', textDecoration: 'none' }}>Open Location</a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timings */}
            <div style={{ backgroundColor: '#121216', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#60a5fa" /> Call Timings
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 100px), 1fr))', gap: '12px' }}>
                <TimingSlot label="Morning" start={doctor.morningStart} end={doctor.morningEnd} color="#f59e0b" />
                <TimingSlot label="Afternoon" start={doctor.afternoonStart} end={doctor.afternoonEnd} color="#f97316" />
                <TimingSlot label="Evening" start={doctor.eveningStart} end={doctor.eveningEnd} color="#a855f7" />
              </div>
            </div>

            {/* Preferred Days */}
            <div style={{ backgroundColor: '#121216', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#34d399" /> Preferred Days
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DAYS_OF_WEEK.map((day, idx) => {
                  const isPref = doctor.preferredDays.includes(idx);
                  const isEx = doctor.exStationDays.includes(idx);
                  return (
                    <div key={idx} style={{
                      flex: '1 1 auto', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700, minWidth: '40px',
                      backgroundColor: isPref ? 'rgba(52,211,153,0.15)' : isEx ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)',
                      color: isPref ? '#34d399' : isEx ? '#f87171' : '#5a5a68',
                      textDecoration: isEx ? 'line-through' : 'none',
                      opacity: isEx ? 0.5 : 1
                    }}>
                      {day.slice(0, 3)}
                    </div>
                  );
                })}
              </div>
              {doctor.exStationDays.length > 0 && (
                <p style={{ margin: '12px 0 0 0', fontSize: '12px', fontWeight: 600, color: '#f87171' }}>
                  Ex-station: {doctor.exStationDays.map(d => DAYS_OF_WEEK[d]).join(', ')}
                </p>
              )}
            </div>

          </div>

          {/* Sidebar Column: Visit History */}
          <div>
            {doctor.visits && doctor.visits.length > 0 ? (
              <div style={{ backgroundColor: '#121216', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 20px 0' }}>
                  Visit History <span style={{ color: '#8e8e9e', fontWeight: 500 }}>({doctor._count?.visits || 0})</span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {doctor.visits.slice(0, 8).map(visit => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#121216', borderRadius: '24px', padding: '40px 24px', border: '1px solid rgba(255,255,255,0.02)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Calendar size={48} color="#5a5a68" strokeWidth={1} style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#fff' }}>No Visit History</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#8e8e9e', lineHeight: 1.5 }}>You haven't logged any visits for this doctor yet.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>

      <VisitRecordModal open={visitModalOpen} onClose={() => setVisitModalOpen(false)} doctor={doctor} mode="visit" />
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => deleteMutation.mutate()}
        title="Delete Doctor" message={`Are you sure you want to delete ${doctor.name}? This cannot be undone.`}
        confirmLabel="Delete" variant="danger" />
    </div>
  );
}

/* --- Helper Components --- */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#8e8e9e', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
      </div>
    </div>
  );
}

function TimingSlot({ label, start, end, color }: { label: string; start?: string; end?: string; color: string }) {
  return (
    <div style={{ 
      backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px 12px', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.02)'
    }}>
      <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 700, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      {start && end ? (
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: color }}>{start}–{end}</p>
      ) : (
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#5a5a68' }}>N/A</p>
      )}
    </div>
  );
}

function VisitCard({ visit }: { visit: Visit }) {
  return (
    <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff' }}>
          {new Date(visit.visitDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <span style={{ 
          fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase',
          backgroundColor: visit.completed ? 'rgba(52,211,153,0.1)' : visit.skipped ? 'rgba(248,113,113,0.1)' : 'rgba(142,142,158,0.1)',
          color: visit.completed ? '#34d399' : visit.skipped ? '#f87171' : '#8e8e9e'
        }}>
          {visit.completed ? 'Visited' : visit.skipped ? 'Skipped' : 'Pending'}
        </span>
      </div>

      {(visit.brandsPromoted?.length > 0 || visit.brandsWritten?.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visit.brandsPromoted && visit.brandsPromoted.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <Package size={12} color="#60a5fa" style={{ marginTop: '2px' }} />
              {visit.brandsPromoted.map(b => (
                <span key={b} style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.1)', padding: '2px 8px', borderRadius: '99px' }}>{b}</span>
              ))}
            </div>
          )}
          {visit.brandsWritten && visit.brandsWritten.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <FileText size={12} color="#34d399" style={{ marginTop: '2px' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>Wrote:</span>
              {visit.brandsWritten.map(b => (
                <span key={b} style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', backgroundColor: 'rgba(52,211,153,0.1)', padding: '2px 8px', borderRadius: '99px' }}>{b}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {visit.doctorFeedback && (
        <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
          <span style={{ color: '#5a5a68', fontSize: '16px', lineHeight: 1, marginTop: '-2px' }}>"</span>
          <p style={{ margin: 0, fontSize: '12px', color: '#b0b0bc', fontStyle: 'italic', lineHeight: 1.5 }}>{visit.doctorFeedback}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {visit.rxCommitment && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#8e8e9e' }}>
            <Hash size={12} color="#5a5a68" /> Rx: <span style={{ color: '#fff' }}>{visit.rxCommitment}</span>
          </span>
        )}
        {visit.followUpDate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginLeft: 'auto' }}>
            <Calendar size={12} /> F/U: {new Date(visit.followUpDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            {visit.followUpBrand && <span style={{ opacity: 0.8, marginLeft: '4px', padding: '2px 6px', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '4px' }}>{visit.followUpBrand}</span>}
          </span>
        )}
      </div>
      
      {visit.remarks && (
        <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#8e8e9e', lineHeight: 1.5 }}>
          {visit.remarks}
        </p>
      )}
    </div>
  );
}
