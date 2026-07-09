import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from './ui/Modal';
import { toast } from '../stores/toastStore';
import api from '../lib/api';
import type { Chemist, Area, ApiResponse } from '../types';
import { Loader2, Plus, Edit2 } from 'lucide-react';

interface ChemistFormModalProps {
  open: boolean;
  onClose: () => void;
  chemist?: Chemist | null;
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

export function ChemistFormModal({ open, onClose, chemist }: ChemistFormModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!chemist;

  const [form, setForm] = useState({
    name: '', pharmacyName: '', phone: '', address: '', areaId: '', beatId: '', notes: '',
  });

  useEffect(() => {
    if (chemist) {
      setForm({
        name: chemist.name || '',
        pharmacyName: chemist.pharmacyName || '',
        phone: chemist.phone || '',
        address: chemist.address || '',
        areaId: chemist.areaId || '',
        beatId: chemist.beatId || '',
        notes: chemist.notes || '',
      });
    } else {
      setForm({ name: '', pharmacyName: '', phone: '', address: '', areaId: '', beatId: '', notes: '' });
    }
  }, [chemist, open]);

  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Area[]>>('/areas');
      return data.data;
    },
  });

  const selectedArea = areas.find((a) => a.id === form.areaId);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        areaId: form.areaId || undefined,
        beatId: form.beatId || undefined,
      };
      if (isEdit) {
        await api.put(`/chemists/${chemist!.id}`, payload);
      } else {
        await api.post('/chemists', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chemists'] });
      toast.success(isEdit ? 'Chemist updated!' : 'Chemist added!');
      onClose();
    },
    onError: () => toast.error('Failed to save chemist'),
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Chemist & Pharmacy' : 'Add New Chemist & Pharmacy'} size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '8px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Chemist Name *</label>
            <input 
              value={form.name} onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Ramesh Kumar" style={inputStyle} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Pharmacy Name</label>
            <input 
              value={form.pharmacyName} onChange={(e) => update('pharmacyName', e.target.value)}
              placeholder="e.g. Apollo Pharmacy" style={inputStyle} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Phone Number</label>
            <input 
              value={form.phone} onChange={(e) => update('phone', e.target.value)}
              placeholder="+91..." style={inputStyle} type="tel" 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Area</label>
            <select 
              value={form.areaId} onChange={(e) => { update('areaId', e.target.value); update('beatId', ''); }}
              style={inputStyle}
            >
              <option value="">Select area</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        {selectedArea?.beats && selectedArea.beats.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Beat / Route</label>
            <select value={form.beatId} onChange={(e) => update('beatId', e.target.value)} style={inputStyle}>
              <option value="">Select beat</option>
              {selectedArea.beats.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Full Address</label>
          <textarea 
            value={form.address} onChange={(e) => update('address', e.target.value)}
            placeholder="Complete shop address..." rows={2} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} 
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Additional Notes</label>
          <textarea 
            value={form.notes} onChange={(e) => update('notes', e.target.value)}
            placeholder="Timings, landmarks, etc." rows={2} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} 
          />
        </div>

        <button 
          onClick={() => mutation.mutate()} 
          disabled={mutation.isPending || !form.name.trim()}
          style={{
            width: '100%', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', color: '#fff', fontSize: '15px', fontWeight: 700,
            border: 'none', cursor: mutation.isPending || !form.name.trim() ? 'not-allowed' : 'pointer',
            opacity: mutation.isPending || !form.name.trim() ? 0.5 : 1, boxShadow: '0 8px 24px rgba(245,158,11,0.2)', marginTop: '8px'
          }}
        >
          {mutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isEdit ? (
            <><Edit2 size={18} strokeWidth={2.5} /> Update Chemist</>
          ) : (
            <><Plus size={18} strokeWidth={2.5} /> Save New Chemist</>
          )}
        </button>
      </div>
    </Modal>
  );
}
