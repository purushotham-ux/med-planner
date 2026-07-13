import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, ArrowLeft, ArrowRight, X } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../stores/toastStore';

// Normalize free-text speciality to our database enum values
const normalizeSpeciality = (raw: string): string => {
  if (!raw) return 'GENERAL_PHYSICIAN';
  const s = raw.trim().toUpperCase();

  // Direct matches & Includes
  if (s.includes('CARDIO')) return 'CARDIOLOGIST';
  if (s.includes('NEURO')) return 'NEUROLOGIST';
  if (s.includes('ORTHO')) return 'ORTHOPEDIC';
  if (s.includes('PEDIATRIC') || s.includes('PAEDIATRIC')) return 'PEDIATRICIAN';
  if (s.includes('ENDOCRIN')) return 'ENDOCRINOLOGIST';
  if (s.includes('GASTRO')) return 'GASTROENTEROLOGIST';

  // ENT variations
  if (s === 'ENT' || s.includes('ENT SURGEON') || s.includes('ENT ') || s.includes('.DLO') || s.includes('MS(ENT)')) return 'ENT';

  // Gynecology variations
  if (s.includes('GYN') || s.includes('OBG') || s.includes('OBST')) return 'GYNECOLOGIST';

  // Diabetology variations
  if (s.includes('DIABET')) return 'DIABETOLOGIST';

  // Gastro surgeon
  if (s.includes('GASTRO')) return 'GASTROENTEROLOGIST';

  // Consulting/Consultant Physician
  if (s.includes('CONSULTANT') || s.includes('CONSULTING') || s === 'PHYSICIAN') return 'CONSULTING_PHYSICIAN';

  // General Physician / GP variations
  if (s === 'GP' || s === 'MBBS GP' || s === 'NON MBBS GP' || s === 'GENERAL' || s.startsWith('GP-')) return 'GENERAL_PHYSICIAN';
  if (s.includes('GENERAL PHYSICIAN') || s.includes('GENERAL PRACTITIONER')) return 'GENERAL_PHYSICIAN';

  // Surgeon → GENERAL_PHYSICIAN (closest available)
  if (s.includes('SURGEON') || s.includes('SURGERY')) return 'GENERAL_PHYSICIAN';

  // Chest / Pulmonology
  if (s.includes('CHEST') || s.includes('PULMON')) return 'CONSULTING_PHYSICIAN';

  // Neuro surgeon
  if (s.includes('NEURO')) return 'NEUROLOGIST';

  // Urologist
  if (s.includes('UROLOG')) return 'CONSULTING_PHYSICIAN';

  // Oncologist
  if (s.includes('ONCOL')) return 'CONSULTING_PHYSICIAN';

  // Fallback
  return 'GENERAL_PHYSICIAN';
};

// Normalize grade to our enum: A, B, C
const normalizeGrade = (raw: string): string => {
  if (!raw) return 'B';
  const g = raw.trim().toUpperCase();
  if (g === 'A+' || g === 'A') return 'A';
  if (g === 'B') return 'B';
  if (g === 'C' || g === 'D' || g === 'D+') return 'C';
  return 'B';
};

// Find a value from a row by trying multiple possible column names
const getField = (row: any, ...keys: string[]): string => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  // Try case-insensitive + stripped match
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    // Strip all non-alphanumeric characters for super-robust matching
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey);
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
      return String(row[found]).trim();
    }
  }
  return '';
};

const SPECIALITY_LABELS: Record<string, string> = {
  GENERAL_PHYSICIAN: 'GP',
  CONSULTING_PHYSICIAN: 'Physician',
  DIABETOLOGIST: 'Diabetologist',
  CARDIOLOGIST: 'Cardiologist',
  NEUROLOGIST: 'Neurologist',
  ORTHOPEDIC: 'Ortho',
  PEDIATRICIAN: 'Pediatrician',
  GYNECOLOGIST: 'Gynecologist',
  ENT: 'ENT',
  ENDOCRINOLOGIST: 'Endocrinologist',
  GASTROENTEROLOGIST: 'Gastro',
};

export function ImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length > 0) {
          console.log('[ImportPage] Columns found:', Object.keys(data[0] as any));
        }

        const mappedData = data.map((row: any) => {
          const name = getField(row, 'Name', 'Doctor Name', 'DOCTOR NAME', 'DoctorName', 'name');
          if (!name) return null;

          const rawSpeciality = getField(row, 'Specialisation', 'Specialization', 'Speciality', 'SPECIALITY', 'Specialty', 'speciality', 'Spec');
          const rawGrade = getField(row, 'Grade', 'GRADE', 'grade');
          const visitFreq = getField(row, 'Visits/Month', 'VisitsMonth', 'Visits', 'visits/month', 'Visit Frequency', 'visitFrequency');
          const qualification = getField(row, 'Qualification', 'QUALIFICATION', 'qualification', 'Qual');

          return {
            name,
            speciality: normalizeSpeciality(rawSpeciality),
            originalSpeciality: rawSpeciality, // Keep original for display
            grade: normalizeGrade(rawGrade),
            originalGrade: rawGrade, // Keep original for display
            hospital: getField(row, 'Hospital', 'HOSPITAL', 'hospital'),
            clinic: getField(row, 'Clinic', 'CLINIC', 'clinic'),
            areaName: getField(row, 'City', 'CITY', 'city', 'Area', 'AREA', 'area', 'AREANAME', 'AreaName', 'Area Name'),
            beatName: getField(row, 'Beat', 'BEAT', 'beat', 'BeatName', 'Beat Name'),
            address: getField(row, 'Address', 'ADDRESS', 'address'),
            phone: getField(row, 'Phone', 'PHONE', 'phone', 'Mobile', 'MOBILE', 'Contact'),
            visitFrequency: visitFreq ? parseInt(visitFreq) || 2 : 2,
            notes: qualification || '', // Store qualification in notes
            kyc: false,
          };
        }).filter(Boolean) as any[];

        // Deduplicate by name
        const seen = new Set<string>();
        const uniqueData = mappedData.filter(doc => {
          const key = doc.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        console.log('[ImportPage] Parsed', uniqueData.length, 'unique doctors');

        if (uniqueData.length === 0) {
          setError('No valid doctor records found. Make sure your file has a "Name" column.');
        } else {
          setParsedData(uniqueData);
        }
      } catch (err: any) {
        console.error('[ImportPage] Parse error:', err);
        setError('Failed to parse file. Error: ' + err.message);
      }
      e.target.value = '';
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsBinaryString(selectedFile);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const toggleKyc = (index: number) => {
    setParsedData(prev => prev.map((doc, i) => i === index ? { ...doc, kyc: !doc.kyc } : doc));
  };

  const handleImport = async () => {
    if (!parsedData.length) return;

    setIsProcessing(true);
    try {
      // Strip display-only fields before sending to API
      const payload = parsedData.map(({ originalSpeciality, originalGrade, ...doc }) => doc);
      const response = await api.post('/doctors/bulk', { doctors: payload });
      console.log('[ImportPage] Import response:', response.data);
      toast.success(`Successfully imported ${parsedData.length} doctors!`);
      navigate('/doctors');
    } catch (err: any) {
      console.error('[ImportPage] Import error:', err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || 'Import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const removeRow = (index: number) => {
    setParsedData(prev => prev.filter((_, i) => i !== index));
  };

  const kycCount = parsedData.filter(d => d.kyc).length;

  // Styles
  const thStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' };
  const tdStyle: React.CSSProperties = { padding: '10px 16px', fontSize: '13px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0f', color: '#fff' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: 'min(5vw, 24px)', maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/doctors')} style={{ background: 'transparent', border: 'none', color: '#8e8e9e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0' }}>Import Doctors</h1>
            <p style={{ fontSize: '13px', color: '#8e8e9e', margin: 0, fontWeight: 500 }}>Upload an Excel or CSV file to bulk-add doctors</p>
          </div>
        </div>
      </div>

      <div style={{ padding: 'min(5vw, 24px)', maxWidth: '1400px', margin: '0 auto', width: '100%', flex: 1, overflow: 'auto' }}>
        {!parsedData.length ? (
          <div style={{ backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(20, 184, 166, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <UploadCloud size={40} color="#14b8a6" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>Upload your file</h3>
            <p style={{ color: '#8e8e9e', maxWidth: '500px', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              Supported columns: <strong style={{ color: '#ccc' }}>Name</strong>, Specialisation, Grade, City, Qualification, Visits/Month, Area, Beat, Hospital, Phone
            </p>
            <p style={{ color: '#6e6e7e', maxWidth: '500px', margin: '0 0 32px 0', lineHeight: 1.5, fontSize: '13px' }}>
              We auto-map speciality names (e.g. "CONSULTANT PHYSICIAN" → Physician, "GYNAECOLOGIST" → Gynecologist) and normalize grades (A+ → A, D → C).
            </p>

            <button
              onClick={triggerFileInput}
              style={{
                backgroundColor: '#14b8a6', color: '#fff', padding: '12px 32px', borderRadius: '12px', border: 'none',
                fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)', fontSize: '15px'
              }}
            >
              <FileText size={20} />
              Select Excel or CSV File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {error && (
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden' }}>

              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(20, 184, 166, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0' }}>
                      {parsedData.length} Doctors Ready
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8e8e9e', margin: 0 }}>
                      {kycCount > 0 ? `${kycCount} marked as KYC · ` : ''}Click KYC column to toggle
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setParsedData([])}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '60vh' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#141418', zIndex: 10 }}>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Speciality</th>
                      <th style={thStyle}>City / Area</th>
                      <th style={thStyle}>Grade</th>
                      <th style={thStyle}>V/M</th>
                      <th style={thStyle}>KYC</th>
                      <th style={{ ...thStyle, width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((doc, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ ...tdStyle, color: '#6e6e7e', width: '40px' }}>{idx + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, minWidth: '180px' }}>
                          {doc.name}
                          {doc.notes && <span style={{ display: 'block', fontSize: '11px', color: '#6e6e7e', fontWeight: 400, marginTop: '2px' }}>{doc.notes}</span>}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ padding: '3px 8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#aaa' }}>
                            {SPECIALITY_LABELS[doc.speciality] || doc.speciality}
                          </span>
                          {doc.originalSpeciality && doc.originalSpeciality.toUpperCase() !== doc.speciality && (
                            <span style={{ display: 'block', fontSize: '10px', color: '#555', marginTop: '2px' }}>← {doc.originalSpeciality}</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: '#8e8e9e' }}>{doc.areaName || '-'}</td>
                        <td style={tdStyle}>
                          <span style={{
                            width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: doc.grade === 'A' ? 'rgba(34,197,94,0.1)' : doc.grade === 'B' ? 'rgba(59,130,246,0.1)' : 'rgba(234,179,8,0.1)',
                            color: doc.grade === 'A' ? '#22c55e' : doc.grade === 'B' ? '#3b82f6' : '#eab308',
                            borderRadius: '6px', fontWeight: 700, fontSize: '13px'
                          }}>
                            {doc.grade}
                          </span>
                          {doc.originalGrade && doc.originalGrade !== doc.grade && (
                            <span style={{ fontSize: '10px', color: '#555', marginLeft: '4px' }}>({doc.originalGrade})</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: '#8e8e9e', textAlign: 'center' }}>{doc.visitFrequency}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => toggleKyc(idx)}
                            style={{
                              width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                              backgroundColor: doc.kyc ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                              color: doc.kyc ? '#22c55e' : '#555',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700
                            }}
                          >
                            {doc.kyc ? '✓' : ''}
                          </button>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <button onClick={() => removeRow(idx)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}>
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '24px' }}>
              <button
                onClick={handleImport}
                disabled={isProcessing || !parsedData.length}
                style={{
                  backgroundColor: '#14b8a6', color: '#fff', padding: '14px 32px', borderRadius: '12px',
                  fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1, border: 'none', boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)'
                }}
              >
                {isProcessing ? 'Importing...' : `Import ${parsedData.length} Doctors`}
                {!isProcessing && <ArrowRight size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
