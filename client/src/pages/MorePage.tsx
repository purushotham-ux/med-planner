import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/toastStore';
import { ChemistFormModal } from '../components/ChemistFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { ApiResponse, Chemist, Brand } from '../types';
import {
  LogOut, MapPin, FileDown, BarChart3,
  Building2, ChevronRight, Plus, Info,
  Phone, Edit2, Trash2, History, Package, X
} from 'lucide-react';

export function MorePage() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [chemistForm, setChemistForm] = useState<{ open: boolean; chemist: Chemist | null }>({ open: false, chemist: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string; type: string }>({ open: false, id: '', name: '', type: 'chemist' });
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCategory, setNewBrandCategory] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>('/dashboard/stats');
      return data.data;
    },
  });

  const { data: chemists = [] } = useQuery({
    queryKey: ['chemists'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Chemist[]>>('/chemists');
      return data.data;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Brand[]>>('/brands');
      return data.data;
    },
  });

  const deleteChemist = useMutation({
    mutationFn: (id: string) => api.delete(`/chemists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chemists'] });
      toast.success('Chemist deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const addBrand = useMutation({
    mutationFn: (data: { name: string; category?: string }) => api.post('/brands', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setNewBrandName('');
      setNewBrandCategory('');
      toast.success('Brand added');
    },
    onError: () => toast.error('Failed to add brand'),
  });

  const deleteBrand = useMutation({
    mutationFn: (id: string) => api.delete(`/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleExport = async () => {
    try {
      const { data } = await api.get('/doctors?limit=5000');
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medrep-doctors-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Doctors exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0f', overflowY: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '24px 24px 100px 24px' }}>
        
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: '0 0 24px 0', letterSpacing: '-0.5px' }}>More</h1>

        {/* User Card */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', borderRadius: '24px', marginBottom: '32px',
          background: 'linear-gradient(145deg, #16161a 0%, #0f0f12 100%)', border: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100px', height: '100px', background: 'rgba(245,158,11,0.1)', filter: 'blur(40px)' }} />
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 700, color: '#fff', position: 'relative', zIndex: 10,
            background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', boxShadow: '0 8px 24px rgba(245,158,11,0.3)'
          }}>
            {user?.name?.charAt(0) || 'M'}
          </div>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>{user?.name || 'Medical Rep'}</h2>
            <p style={{ fontSize: '14px', color: '#8e8e9e', margin: 0 }}>{user?.email}</p>
          </div>
        </div>

        {/* Statistics Area */}
        {stats && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e4e4ea', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <BarChart3 size={16} color="#f59e0b" /> Overall Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#121216', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0', lineHeight: 1 }}>{stats.totalDoctors}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Total Doctors</p>
              </div>
              <div style={{ backgroundColor: '#121216', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0', lineHeight: 1 }}>{stats.monthlyVisits}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Visits This Month</p>
              </div>
              <div style={{ backgroundColor: '#121216', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(52,211,153,0.1), transparent 70%)' }} />
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#34d399', margin: '0 0 8px 0', lineHeight: 1, position: 'relative' }}>{stats.coverage?.percentage || 0}%</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, position: 'relative' }}>Coverage</p>
              </div>
            </div>
            {stats.doctorsByGrade && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                {stats.doctorsByGrade.map((g: any) => {
                  const gc = g.grade === 'A' ? '#f87171' : g.grade === 'B' ? '#f59e0b' : '#34d399';
                  return (
                    <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: gc }} />
                      <span style={{ fontSize: '13px', color: '#8e8e9e', fontWeight: 500 }}>
                        Grade {g.grade}: <span style={{ color: '#fff', fontWeight: 700 }}>{g._count}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Database Management Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          
          {/* Chemists Accordion */}
          <div style={{ backgroundColor: '#121216', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.02)', overflow: 'hidden' }}>
            <button onClick={() => setActiveSection(activeSection === 'chemists' ? null : 'chemists')} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none'
            }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(168,85,247,0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={20} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>Chemists & Pharmacies</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#8e8e9e' }}>{chemists.length} registered facilities</p>
              </div>
              <ChevronRight size={20} color="#5a5a68" style={{ transform: activeSection === 'chemists' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            
            {activeSection === 'chemists' && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => setChemistForm({ open: true, chemist: null })} style={{
                  width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '14px', fontWeight: 600,
                  backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer'
                }}>
                  <Plus size={16} strokeWidth={2.5} /> Add New Chemist
                </button>
                {chemists.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {chemists.map((c, i) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: i < chemists.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#8e8e9e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.pharmacyName && `${c.pharmacyName} • `}{c.area?.name || 'No area'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
                          {c.phone && (
                            <a href={`tel:${c.phone}`} style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Phone size={14} />
                            </a>
                          )}
                          <button onClick={() => setChemistForm({ open: true, chemist: c })} style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm({ open: true, id: c.id, name: c.name, type: 'chemist' })} style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ padding: '24px', textAlign: 'center', margin: 0, fontSize: '13px', color: '#5a5a68' }}>No chemists added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Brands Accordion */}
          <div style={{ backgroundColor: '#121216', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.02)', overflow: 'hidden' }}>
            <button onClick={() => setActiveSection(activeSection === 'brands' ? null : 'brands')} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none'
            }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={20} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>Brands / Products</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#8e8e9e' }}>{brands.length} active brands</p>
              </div>
              <ChevronRight size={20} color="#5a5a68" style={{ transform: activeSection === 'brands' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            
            {activeSection === 'brands' && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '16px', display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <input type="text" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Brand name" style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', backgroundColor: '#0a0a0f', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', outline: 'none' }} />
                  <input type="text" value={newBrandCategory} onChange={e => setNewBrandCategory(e.target.value)} placeholder="Category (opt)" style={{ width: '120px', padding: '10px 16px', borderRadius: '10px', backgroundColor: '#0a0a0f', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', outline: 'none' }} />
                  <button onClick={() => { if (newBrandName.trim()) addBrand.mutate({ name: newBrandName.trim(), category: newBrandCategory.trim() || undefined }); }} disabled={!newBrandName.trim()} style={{ padding: '0 20px', borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'none', cursor: newBrandName.trim() ? 'pointer' : 'default', opacity: newBrandName.trim() ? 1 : 0.5 }}>
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
                {(() => {
                  const groups = new Map<string, Brand[]>();
                  brands.forEach(b => {
                    const cat = b.category || 'Other';
                    if (!groups.has(cat)) groups.set(cat, []);
                    groups.get(cat)!.push(b);
                  });
                  return Array.from(groups.entries()).map(([cat, items]) => (
                    <div key={cat} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.02)', fontSize: '11px', fontWeight: 700, color: '#5a5a68', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {cat} ({items.length})
                      </div>
                      {items.map((b, i) => (
                        <div key={b.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{b.name}</span>
                          <button onClick={() => setDeleteConfirm({ open: true, id: b.id, name: b.name, type: 'brand' })} style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'transparent', color: '#f87171', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          <MenuItem icon={<History size={18} color="#34d399" />} label="Visit History" sublabel="View all past visit records" onClick={() => navigate('/visits')} />
          <MenuItem icon={<MapPin size={18} color="#60a5fa" />} label="Areas & Beats" sublabel="Manage your territory areas" onClick={() => navigate('/areas')} />
          <MenuItem icon={<FileDown size={18} color="#f59e0b" />} label="Export Doctors Data" sublabel="Download as a JSON backup" onClick={handleExport} />
          <MenuItem icon={<Info size={18} color="#a855f7" />} label="About MedRep Planner" sublabel="Version 1.0 Enterprise" />
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={{
          width: '100%', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '15px', fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
        }}>
          <LogOut size={20} strokeWidth={2.5} />
          Sign Out of Application
        </button>

      </div>

      <ChemistFormModal open={chemistForm.open} onClose={() => setChemistForm({ open: false, chemist: null })} chemist={chemistForm.chemist} />
      <ConfirmDialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: '', name: '', type: 'chemist' })}
        onConfirm={() => deleteConfirm.type === 'brand' ? deleteBrand.mutate(deleteConfirm.id) : deleteChemist.mutate(deleteConfirm.id)}
        title={`Delete ${deleteConfirm.type === 'brand' ? 'Brand' : 'Chemist'}`} message={`Are you sure you want to delete ${deleteConfirm.name}?`}
        confirmLabel="Delete" variant="danger" />
    </div>
  );
}

function MenuItem({ icon, label, sublabel, onClick }: { icon: React.ReactNode; label: string; sublabel?: string; onClick?: () => void; }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#121216',
      border: '1px solid rgba(255,255,255,0.02)', borderRadius: '16px', cursor: onClick ? 'pointer' : 'default', textAlign: 'left'
    }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{label}</p>
        {sublabel && <p style={{ margin: 0, fontSize: '12px', color: '#8e8e9e' }}>{sublabel}</p>}
      </div>
      <ChevronRight size={18} color="#5a5a68" />
    </button>
  );
}
