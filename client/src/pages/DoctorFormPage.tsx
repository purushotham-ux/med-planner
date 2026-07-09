import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { toast } from '../stores/toastStore';
import type { Doctor, Area, Beat, Chemist, ApiResponse, Speciality, Grade, TimeSlot } from '../types';
import { SPECIALITY_LABELS, DAYS_OF_WEEK } from '../types';
import { ArrowLeft, Save, Loader2, MapPin, Plus } from 'lucide-react';
import { ChemistFormModal } from '../components/ChemistFormModal';

interface DoctorFormData {
  name: string;
  speciality: Speciality;
  grade: Grade;
  hospital?: string;
  clinic?: string;
  areaId?: string;
  beatId?: string;
  chemistId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  morningStart?: string;
  morningEnd?: string;
  afternoonStart?: string;
  afternoonEnd?: string;
  eveningStart?: string;
  eveningEnd?: string;
  preferredDays: number[];
  preferredTime?: TimeSlot;
  exStationDays: number[];
  assistantName?: string;
  phone?: string;
  notes?: string;
  priority: number;
  visitFrequency: number;
}

export function DoctorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: doctor } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
      return data.data;
    },
    enabled: isEditing,
  });

  const { data: areasData } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Area[]>>('/areas');
      return data.data;
    },
  });

  const { data: beatsData } = useQuery({
    queryKey: ['beats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Beat[]>>('/beats');
      return data.data;
    },
  });

  const { data: chemistsData } = useQuery({
    queryKey: ['chemists'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Chemist[]>>('/chemists');
      return data.data;
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DoctorFormData>({
    values: isEditing && doctor ? {
      name: doctor.name,
      speciality: doctor.speciality,
      grade: doctor.grade,
      hospital: doctor.hospital || '',
      clinic: doctor.clinic || '',
      areaId: doctor.areaId || '',
      beatId: doctor.beatId || '',
      chemistId: doctor.chemistId || '',
      address: doctor.address || '',
      latitude: doctor.latitude,
      longitude: doctor.longitude,
      morningStart: doctor.morningStart || '',
      morningEnd: doctor.morningEnd || '',
      afternoonStart: doctor.afternoonStart || '',
      afternoonEnd: doctor.afternoonEnd || '',
      eveningStart: doctor.eveningStart || '',
      eveningEnd: doctor.eveningEnd || '',
      preferredDays: doctor.preferredDays || [],
      preferredTime: doctor.preferredTime,
      exStationDays: doctor.exStationDays || [],
      assistantName: doctor.assistantName || '',
      phone: doctor.phone || '',
      notes: doctor.notes || '',
      priority: doctor.priority || 5,
      visitFrequency: doctor.visitFrequency || 2,
      googleMapsUrl: doctor.googleMapsUrl || '',
    } : {
      name: '',
      speciality: 'GENERAL_PHYSICIAN',
      grade: 'B',
      preferredDays: [],
      exStationDays: [],
      priority: 5,
      visitFrequency: 2,
    },
  });

  const [preferredDays, setPreferredDays] = useState<number[]>(doctor?.preferredDays || []);
  const [exStationDays, setExStationDays] = useState<number[]>(doctor?.exStationDays || []);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [chemistModalOpen, setChemistModalOpen] = useState(false);

  const selectedArea = watch('areaId');

  const mutation = useMutation({
    mutationFn: async (data: DoctorFormData) => {
      const payload = {
        ...data,
        preferredDays,
        exStationDays,
        latitude: data.latitude ? parseFloat(String(data.latitude)) : undefined,
        longitude: data.longitude ? parseFloat(String(data.longitude)) : undefined,
        priority: parseInt(String(data.priority)),
        hospital: data.hospital || undefined,
        clinic: data.clinic || undefined,
        areaId: data.areaId || undefined,
        beatId: data.beatId || undefined,
        chemistId: data.chemistId || undefined,
        address: data.address || undefined,
        morningStart: data.morningStart || undefined,
        morningEnd: data.morningEnd || undefined,
        afternoonStart: data.afternoonStart || undefined,
        afternoonEnd: data.afternoonEnd || undefined,
        eveningStart: data.eveningStart || undefined,
        eveningEnd: data.eveningEnd || undefined,
        assistantName: data.assistantName || undefined,
        phone: data.phone || undefined,
        notes: data.notes || undefined,
        preferredTime: data.preferredTime || undefined,
        visitFrequency: parseInt(String(data.visitFrequency)),
        googleMapsUrl: data.googleMapsUrl || undefined,
      };

      if (isEditing) {
        return api.put(`/doctors/${id}`, payload);
      }
      return api.post('/doctors', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      if (isEditing) queryClient.invalidateQueries({ queryKey: ['doctor', id] });
      toast.success(isEditing ? 'Doctor updated!' : 'Doctor added!');
      navigate(isEditing ? `/doctors/${id}` : '/doctors');
    },
    onError: () => toast.error('Failed to save doctor'),
  });

  const geocodeAddress = async () => {
    const address = watch('address');
    if (!address) return;
    setIsGeocodingAddress(true);
    try {
      const { data } = await api.post('/geocode', { address });
      if (data.data?.[0]) {
        setValue('latitude', data.data[0].latitude);
        setValue('longitude', data.data[0].longitude);
        toast.success('Location found!');
      } else {
        toast.warning('Address not found');
      }
    } catch (e) {
      toast.error('Geocoding failed');
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const toggleDay = (day: number, list: number[], setList: (d: number[]) => void) => {
    setList(list.includes(day) ? list.filter((d) => d !== day) : [...list, day]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0f', overflowY: 'auto' }}>
      
      {/* Sticky Header Area */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)',
        padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{
            width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)',
            border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
              {isEditing ? 'Edit Doctor Profile' : 'Add New Doctor'}
            </h1>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px', paddingBottom: '100px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Basic Info */}
            <Section title="Basic Information">
              <FormField label="Full Name *" error={errors.name?.message}>
                <input {...register('name', { required: 'Name is required' })} style={inputStyle} placeholder="Dr. John Doe" />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
                <FormField label="Speciality *">
                  <select {...register('speciality')} style={inputStyle}>
                    {Object.entries(SPECIALITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Grade *">
                  <select {...register('grade')} style={inputStyle}>
                    <option value="A">A (High Value)</option>
                    <option value="B">B (Medium)</option>
                    <option value="C">C (Low)</option>
                  </select>
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
                <FormField label="Hospital Name">
                  <input {...register('hospital')} style={inputStyle} placeholder="E.g. Apollo Hospital" />
                </FormField>
                <FormField label="Clinic Name">
                  <input {...register('clinic')} style={inputStyle} placeholder="E.g. Care Clinic" />
                </FormField>
              </div>
            </Section>

            {/* Area & Location */}
            <Section title="Territory & Location">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
                <FormField label="Area">
                  <select {...register('areaId')} style={inputStyle}>
                    <option value="">Select an area</option>
                    {areasData?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Beat">
                  <select {...register('beatId')} style={inputStyle}>
                    <option value="">Select a beat</option>
                    {beatsData?.filter((b) => !selectedArea || b.areaId === selectedArea).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Address">
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input {...register('address')} style={{ ...inputStyle, flex: 1 }} placeholder="Full physical address" />
                  <button type="button" onClick={geocodeAddress} disabled={isGeocodingAddress} style={{
                    padding: '0 20px', borderRadius: '12px', backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399',
                    border: 'none', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                  }}>
                    {isGeocodingAddress ? <Loader2 size={16} className="animate-spin" /> : <><MapPin size={16} /> Locate</>}
                  </button>
                </div>
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
                <FormField label="Latitude (Optional)">
                  <input {...register('latitude')} type="number" step="any" style={inputStyle} placeholder="E.g. 12.9716" />
                </FormField>
                <FormField label="Longitude (Optional)">
                  <input {...register('longitude')} type="number" step="any" style={inputStyle} placeholder="E.g. 77.5946" />
                </FormField>
              </div>
              <FormField label="Google Maps Link">
                <input {...register('googleMapsUrl')} style={inputStyle} placeholder="https://maps.google.com/..." />
              </FormField>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#8e8e9e' }}>Primary Chemist / Pharmacy</label>
                <button type="button" onClick={() => setChemistModalOpen(true)} style={{
                  backgroundColor: 'transparent', border: 'none', color: '#f59e0b', fontSize: '12px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0
                }}>
                  <Plus size={14} strokeWidth={3} /> Add New
                </button>
              </div>
              <select {...register('chemistId')} style={inputStyle}>
                <option value="">Select chemist</option>
                {chemistsData?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.pharmacyName ? ` (${c.pharmacyName})` : ''}
                  </option>
                ))}
              </select>
            </Section>

            {/* Visit Parameters */}
            <Section title="Visit Requirements">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
                <FormField label="Visit Frequency (Per Month)">
                  <select {...register('visitFrequency')} style={inputStyle}>
                    <option value={3}>3 Visits / month (High Focus)</option>
                    <option value={2}>2 Visits / month (Standard)</option>
                    <option value={1}>1 Visit / month (Maintenance)</option>
                  </select>
                </FormField>
                <FormField label="Priority Level (1=Highest, 10=Lowest)">
                  <input {...register('priority')} type="number" min={1} max={10} style={inputStyle} />
                </FormField>
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Preferred Visit Days</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DAYS_OF_WEEK.map((day, idx) => {
                    const isSelected = preferredDays.includes(idx);
                    return (
                      <button key={`pref-${idx}`} type="button" onClick={() => toggleDay(idx, preferredDays, setPreferredDays)} style={{
                        width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                        backgroundColor: isSelected ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#34d399' : '#8e8e9e'
                      }}>
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>Ex-Station Days (Do Not Visit)</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DAYS_OF_WEEK.map((day, idx) => {
                    const isSelected = exStationDays.includes(idx);
                    return (
                      <button key={`ex-${idx}`} type="button" onClick={() => toggleDay(idx, exStationDays, setExStationDays)} style={{
                        width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                        backgroundColor: isSelected ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#f87171' : '#8e8e9e'
                      }}>
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>

            {/* Timings */}
            <Section title="Timings">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8e8e9e', margin: 0 }}>Shift</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8e8e9e', margin: 0 }}>From</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8e8e9e', margin: 0 }}>To</p>
                </div>
                {['morning', 'afternoon', 'evening'].map((slot) => (
                  <div key={slot} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{slot}</span>
                    <input {...register(`${slot}Start` as any)} type="time" style={inputStyle} />
                    <input {...register(`${slot}End` as any)} type="time" style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px' }}>
                <FormField label="Preferred Time Slot">
                  <select {...register('preferredTime')} style={inputStyle}>
                    <option value="">Any time</option>
                    <option value="MORNING">Morning</option>
                    <option value="AFTERNOON">Afternoon</option>
                    <option value="EVENING">Evening</option>
                  </select>
                </FormField>
              </div>
            </Section>

            {/* Contact & Notes */}
            <Section title="Contact & Notes">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
                <FormField label="Phone Number">
                  <input {...register('phone')} type="tel" style={inputStyle} placeholder="e.g. 9876543210" />
                </FormField>
                <FormField label="Assistant Name">
                  <input {...register('assistantName')} style={inputStyle} placeholder="Name of assistant" />
                </FormField>
              </div>
              <FormField label="Additional Notes">
                <textarea {...register('notes')} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', paddingTop: '16px' }} placeholder="Any other important information..." />
              </FormField>
            </Section>

            {/* Submit */}
            {mutation.isError && (
              <div style={{ padding: '16px', backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', color: '#f87171', fontSize: '14px', fontWeight: 600 }}>
                Failed to save doctor. Please check your inputs and try again.
              </div>
            )}

            <button type="submit" disabled={mutation.isPending} style={{
              width: '100%', padding: '18px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none',
              cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1, boxShadow: '0 8px 24px rgba(245,158,11,0.2)'
            }}>
              {mutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <><Save size={20} strokeWidth={2.5} /> {isEditing ? 'Update Doctor Profile' : 'Save New Doctor'}</>
              )}
            </button>
          </form>
        </div>
      </div>

      <ChemistFormModal open={chemistModalOpen} onClose={() => setChemistModalOpen(false)} />
    </div>
  );
}

/* --- Inline Styles for guaranteed rendering --- */

const inputStyle = {
  width: '100%',
  padding: '16px',
  borderRadius: '12px',
  backgroundColor: '#0a0a0f',
  border: '1px solid rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: '14.5px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box' as const,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#121216', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.02)' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '4px', height: '16px', borderRadius: '4px', backgroundColor: '#f59e0b' }} />
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#8e8e9e', marginBottom: '8px' }}>{label}</label>
      {children}
      {error && <p style={{ margin: '6px 0 0 0', fontSize: '12px', fontWeight: 600, color: '#f87171' }}>{error}</p>}
    </div>
  );
}
