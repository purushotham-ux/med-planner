import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, ArrowLeft, ArrowRight, X } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../stores/toastStore';

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
        
        // Basic mapping logic
        const mappedData = data.map((row: any) => ({
          name: row['Name'] || row['Doctor Name'] || row['name'] || '',
          speciality: row['Speciality'] || row['speciality'] || 'GENERAL_PHYSICIAN',
          grade: row['Grade'] || row['grade'] || 'B',
          hospital: row['Hospital'] || row['hospital'] || '',
          clinic: row['Clinic'] || row['clinic'] || '',
          areaName: row['Area'] || row['area'] || '',
          beatName: row['Beat'] || row['beat'] || '',
          address: row['Address'] || row['address'] || '',
          phone: row['Phone'] || row['phone'] || '',
        })).filter(doc => doc.name); // Filter out empty rows

        setParsedData(mappedData);
      } catch (err) {
        setError('Failed to parse file. Please ensure it is a valid Excel format.');
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    };
    reader.readAsBinaryString(selectedFile);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async () => {
    if (!parsedData.length) return;
    
    setIsProcessing(true);
    try {
      await api.post('/doctors/bulk', { doctors: parsedData });
      toast.success(`Successfully imported ${parsedData.length} doctors!`);
      navigate('/doctors');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import doctors');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeRow = (index: number) => {
    setParsedData(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0f', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: 'min(5vw, 24px)', maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/doctors')}
            style={{ background: 'transparent', border: 'none', color: '#8e8e9e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0' }}>Import Doctors</h1>
            <p style={{ fontSize: '13px', color: '#8e8e9e', margin: 0, fontWeight: 500 }}>Upload an Excel or CSV file to add multiple doctors</p>
          </div>
        </div>
      </div>

      <div style={{ padding: 'min(5vw, 24px)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {!parsedData.length ? (
          <div style={{ backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(20, 184, 166, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <UploadCloud size={40} color="#14b8a6" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>Upload your file</h3>
            <p style={{ color: '#8e8e9e', maxWidth: '400px', margin: '0 0 32px 0', lineHeight: 1.5 }}>
              Your file should have columns for Name, Area, Beat, Speciality, and Grade. We will automatically map matching columns.
            </p>

          <button
            onClick={triggerFileInput}
            style={{
              backgroundColor: '#14b8a6', color: '#fff', padding: '12px 32px', borderRadius: '12px', border: 'none',
              fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)', transition: 'all 0.2s', fontSize: '15px'
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(20, 184, 166, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px 0' }}>Preview Data</h3>
                  <p style={{ fontSize: '13px', color: '#8e8e9e', margin: 0 }}>Found {parsedData.length} valid doctor records</p>
                </div>
              </div>
              <button
                onClick={() => setParsedData([])}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Area</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Beat</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Speciality</th>
                    <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#8e8e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grade</th>
                    <th style={{ padding: '16px', width: '48px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((doc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{doc.name}</td>
                      <td style={{ padding: '16px', color: '#8e8e9e' }}>{doc.areaName || '-'}</td>
                      <td style={{ padding: '16px', color: '#8e8e9e' }}>{doc.beatName || '-'}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#aaa' }}>
                          {doc.speciality}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', borderRadius: '6px', fontWeight: 700, fontSize: '13px' }}>
                          {doc.grade}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => removeRow(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleImport}
              disabled={isProcessing || !parsedData.length}
              style={{
                backgroundColor: '#14b8a6', color: '#fff', padding: '14px 32px', borderRadius: '12px',
                fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.7 : 1, border: 'none', boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)'
              }}
            >
              {isProcessing ? 'Importing...' : 'Confirm Import'}
              {!isProcessing && <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
