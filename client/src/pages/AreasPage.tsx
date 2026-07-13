import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import { toast } from '../stores/toastStore';
import type { Area, ApiResponse } from '../types';
import { MapPin, Plus, Users, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AreasPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState('#14b8a6');
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Area[]>>('/areas');
      return data.data;
    },
  });

  const addArea = useMutation({
    mutationFn: (data: { name: string; color: string }) => api.post('/areas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setShowAddArea(false);
      setNewAreaName('');
      toast.success('Area added!');
    },
    onError: () => toast.error('Failed to add area'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0f', overflowY: 'auto' }}>
      
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: 'min(5vw, 24px)', maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/more')} style={{ background: 'transparent', border: 'none', color: '#8e8e9e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px' }}>
              <ArrowLeft size={24} />
            </button>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#fff' }}>Areas & Beats</h1>
          </div>
          <button
            onClick={() => setShowAddArea(!showAddArea)}
            style={{
              width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
              border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)'
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div style={{ padding: '24px min(5vw, 24px) 100px min(5vw, 24px)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>

        {showAddArea && (
          <div style={{ backgroundColor: '#121216', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0' }}>Add New Area</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Enter area name..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', backgroundColor: '#0a0a0f', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', fontSize: '15px', outline: 'none' }}
              />
              <input
                type="color"
                value={newAreaColor}
                onChange={(e) => setNewAreaColor(e.target.value)}
                style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', padding: 0, cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <button
                onClick={() => addArea.mutate({ name: newAreaName, color: newAreaColor })}
                disabled={!newAreaName.trim() || addArea.isPending}
                style={{
                  padding: '0 24px', height: '44px', borderRadius: '12px', background: '#14b8a6',
                  color: '#fff', fontWeight: 600, border: 'none', cursor: newAreaName.trim() ? 'pointer' : 'not-allowed',
                  opacity: newAreaName.trim() ? 1 : 0.5
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '80px', backgroundColor: '#121216', borderRadius: '20px', opacity: 0.5 }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {areas?.map((area) => (
              <div key={area.id} style={{ backgroundColor: '#121216', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedArea(expandedArea === area.id ? null : area.id)}
                  style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${area.color || '#14b8a6'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={22} style={{ color: area.color || '#14b8a6' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>{area.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#8e8e9e' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {area._count?.doctors || 0} doctors</span>
                      <span>•</span>
                      <span>{area._count?.beats || 0} beats</span>
                    </div>
                  </div>
                  {expandedArea === area.id ? <ChevronDown size={20} color="#5a5a68" /> : <ChevronRight size={20} color="#5a5a68" />}
                </div>

                {expandedArea === area.id && (
                  <div style={{ padding: '0 20px 20px 20px' }}>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {area.beats && area.beats.length > 0 ? (
                        area.beats.map((beat) => (
                          <div key={beat.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: area.color || '#14b8a6' }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 500 }}>{beat.name}</p>
                              {beat.description && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#8e8e9e' }}>{beat.description}</p>}
                            </div>
                            <span style={{ fontSize: '12px', color: '#8e8e9e', fontWeight: 500 }}>
                              {(beat as any)._count?.doctors || 0} docs
                            </span>
                          </div>
                        ))
                      ) : (
                        <p style={{ textAlign: 'center', fontSize: '13px', color: '#5a5a68', margin: 0, padding: '12px 0' }}>No beats added to this area yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {areas?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#121216', borderRadius: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <MapPin size={32} color="#14b8a6" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 8px 0' }}>No Areas Found</h3>
                <p style={{ fontSize: '14px', color: '#8e8e9e', margin: '0 0 24px 0' }}>Create your first area to start organizing doctors.</p>
                <button onClick={() => setShowAddArea(true)} style={{ padding: '12px 24px', borderRadius: '12px', background: '#14b8a6', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  Add Area
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
