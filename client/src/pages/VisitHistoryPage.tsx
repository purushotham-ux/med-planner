import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Visit, ApiResponse } from '../types';
import { SPECIALITY_LABELS, GRADE_COLORS } from '../types';
import {
  Search, Calendar, ChevronLeft, ChevronRight, Package, FileText,
  Hash, Clock, X, StickyNote, Filter
} from 'lucide-react';

export function VisitHistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFollowUpsOnly, setShowFollowUpsOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['visits', page, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (dateFilter) {
        params.set('from', dateFilter);
        params.set('to', dateFilter + 'T23:59:59');
      }
      const { data } = await api.get<ApiResponse<Visit[]>>(`/visits?${params}`);
      return data;
    },
  });

  const visits = data?.data || [];
  const pagination = data?.pagination;

  const filtered = visits.filter(v => {
    if (showFollowUpsOnly && !v.followUpDate) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.doctor?.name?.toLowerCase().includes(s) ||
      v.brandsPromoted?.some(b => b.toLowerCase().includes(s)) ||
      v.brandsWritten?.some(b => b.toLowerCase().includes(s)) ||
      v.doctorFeedback?.toLowerCase().includes(s) ||
      v.followUpBrand?.toLowerCase().includes(s) ||
      v.remarks?.toLowerCase().includes(s)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0f' }}>
      
      {/* Sticky Header Area */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)',
        padding: '24px 24px 16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Visit History</h1>
              <p style={{ fontSize: '13px', color: '#8e8e9e', margin: 0, fontWeight: 500 }}>
                {filtered.length} {filtered.length === 1 ? 'record' : 'records'} found
              </p>
            </div>
            {/* Optional primary action button can go here if needed later */}
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
                placeholder="Search doctor, brand, feedback, notes..."
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
              
              <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <Calendar size={14} style={{ position: 'absolute', left: '14px', color: '#8e8e9e', pointerEvents: 'none' }} />
                <input 
                  type="date" 
                  value={dateFilter} 
                  onChange={e => setDateFilter(e.target.value)}
                  style={{
                    padding: '8px 16px 8px 36px', borderRadius: '99px', backgroundColor: '#141418', color: dateFilter ? '#fff' : '#8e8e9e',
                    border: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, fontSize: '13px', outline: 'none', cursor: 'pointer'
                  }}
                />
              </div>

              <button onClick={() => setShowFollowUpsOnly(!showFollowUpsOnly)} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '99px', flexShrink: 0,
                backgroundColor: showFollowUpsOnly ? 'rgba(245,158,11,0.1)' : '#141418',
                color: showFollowUpsOnly ? '#f59e0b' : '#8e8e9e',
                border: showFollowUpsOnly ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.05)',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <Filter size={14} />
                Follow-ups Only
              </button>

              {(dateFilter || showFollowUpsOnly) && (
                <button onClick={() => { setDateFilter(''); setShowFollowUpsOnly(false); }} style={{
                  padding: '8px 16px', borderRadius: '99px', flexShrink: 0, fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                  backgroundColor: 'transparent', color: '#ef4444', border: 'none', transition: 'all 0.2s'
                }}>
                  Clear Filters
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main List Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '100px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '160px', backgroundColor: '#141418', borderRadius: '20px', opacity: 0.5 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#5a5a68' }}>
              <Calendar size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', color: '#8e8e9e' }}>No visits found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
              {filtered.map(visit => {
                const gradeColor = GRADE_COLORS[visit.doctor?.grade as keyof typeof GRADE_COLORS] || '#aaa';

                return (
                  <div key={visit.id} onClick={() => visit.doctorId && navigate(`/doctors/${visit.doctorId}`)} style={{
                    backgroundColor: '#121216', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)',
                    cursor: visit.doctorId ? 'pointer' : 'default', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
                  }}>
                    
                    {/* Header: Doctor Info + Date & Status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        {visit.doctor?.grade && (
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 800, backgroundColor: `${gradeColor}15`, color: gradeColor
                          }}>
                            {visit.doctor.grade}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {visit.doctor?.name || 'Unknown Doctor'}
                          </h3>
                          <div style={{ fontSize: '12px', color: '#8e8e9e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                            {visit.doctor?.speciality ? SPECIALITY_LABELS[visit.doctor.speciality as keyof typeof SPECIALITY_LABELS] : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '12px', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#8e8e9e' }}>
                          {new Date(visit.visitDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ 
                          fontSize: '11px', fontWeight: 700, marginTop: '4px', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase',
                          backgroundColor: visit.completed ? 'rgba(52,211,153,0.1)' : visit.skipped ? 'rgba(248,113,113,0.1)' : 'rgba(142,142,158,0.1)',
                          color: visit.completed ? '#34d399' : visit.skipped ? '#f87171' : '#8e8e9e'
                        }}>
                          {visit.completed ? 'Visited' : visit.skipped ? 'Skipped' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Feedback & Notes Section */}
                    {(visit.remarks || visit.doctorFeedback) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', flex: 1 }}>
                        {visit.doctorFeedback && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            <span style={{ color: '#5a5a68', fontSize: '18px', leading: 1, marginTop: '-4px' }}>"</span>
                            <p style={{ margin: 0, fontSize: '12px', color: '#b0b0bc', fontStyle: 'italic', lineHeight: 1.5 }}>
                              {visit.doctorFeedback}
                            </p>
                          </div>
                        )}
                        {visit.remarks && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <StickyNote size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '12px', color: '#8e8e9e', lineHeight: 1.5 }}>{visit.remarks}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Brands Section */}
                    {(visit.brandsPromoted?.length > 0 || visit.brandsWritten?.length > 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        {visit.brandsPromoted && visit.brandsPromoted.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                            <Package size={12} color="#60a5fa" />
                            {visit.brandsPromoted.map(b => (
                              <span key={b} style={{ fontSize: '10.5px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>{b}</span>
                            ))}
                          </div>
                        )}
                        {visit.brandsWritten && visit.brandsWritten.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                            <FileText size={12} color="#34d399" />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>Wrote:</span>
                            {visit.brandsWritten.map(b => (
                              <span key={b} style={{ fontSize: '10.5px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399' }}>{b}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer: Rx, Duration, Follow-up */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
                      {visit.rxCommitment && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: '#8e8e9e' }}>
                          <Hash size={12} color="#5a5a68" /> Rx: <span style={{ color: '#fff' }}>{visit.rxCommitment}</span>
                        </span>
                      )}
                      {visit.duration && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: '#8e8e9e' }}>
                          <Clock size={12} color="#5a5a68" /> {visit.duration}min
                        </span>
                      )}
                      {visit.followUpDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700, color: '#f59e0b', marginLeft: 'auto' }}>
                          <Calendar size={12} /> F/U: {new Date(visit.followUpDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          {visit.followUpBrand && <span style={{ opacity: 0.8, marginLeft: '4px', fontSize: '10.5px', padding: '2px 6px', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '4px' }}>{visit.followUpBrand}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '40px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{
                width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: page <= 1 ? 'transparent' : '#141418', border: '1px solid rgba(255,255,255,0.05)',
                color: page <= 1 ? '#5a5a68' : '#fff', cursor: page <= 1 ? 'default' : 'pointer'
              }}>
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#8e8e9e' }}>
                Page <span style={{ color: '#fff' }}>{page}</span> of {pagination.totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{
                width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: page >= pagination.totalPages ? 'transparent' : '#141418', border: '1px solid rgba(255,255,255,0.05)',
                color: page >= pagination.totalPages ? '#5a5a68' : '#fff', cursor: page >= pagination.totalPages ? 'default' : 'pointer'
              }}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
