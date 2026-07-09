import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, ArrowLeft, ArrowRight, X } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../stores/toastStore';

export function ImportPage() {
  const navigate = useNavigate();
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
    };
    reader.readAsBinaryString(selectedFile);
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctors')}
            className="p-2 -ml-2 text-navy-400 hover:text-white hover:bg-navy-800 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Import Doctors</h1>
            <p className="text-navy-300 text-sm mt-1">Upload an Excel or CSV file to add multiple doctors</p>
          </div>
        </div>
      </div>

      {!parsedData.length ? (
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mb-6">
            <UploadCloud size={40} className="text-teal-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Upload your file</h3>
          <p className="text-navy-300 max-w-md mb-8">
            Your file should have columns for Name, Area, Beat, Speciality, and Grade. We will automatically map matching columns.
          </p>

          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-xl font-medium transition-colors cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <FileText size={20} />
            Select Excel or CSV File
          </label>

          {error && (
            <div className="mt-6 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-xl border border-red-400/20">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center text-teal-500">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Preview Data</h3>
                  <p className="text-navy-300 text-sm">Found {parsedData.length} valid doctor records</p>
                </div>
              </div>
              <button
                onClick={() => setParsedData([])}
                className="text-navy-400 hover:text-white px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-navy-950 border-b border-navy-800">
                    <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Name</th>
                    <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Area</th>
                    <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Beat</th>
                    <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Speciality</th>
                    <th className="p-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Grade</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {parsedData.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-navy-800/50 transition-colors">
                      <td className="p-4 text-white font-medium">{doc.name}</td>
                      <td className="p-4 text-navy-300">{doc.areaName || '-'}</td>
                      <td className="p-4 text-navy-300">{doc.beatName || '-'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-navy-800 text-navy-300 rounded-md text-xs">
                          {doc.speciality}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="w-6 h-6 flex items-center justify-center bg-teal-500/10 text-teal-500 rounded-md font-bold text-sm">
                          {doc.grade}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => removeRow(idx)}
                          className="text-navy-400 hover:text-red-400 transition-colors"
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

          <div className="flex justify-end gap-4">
            <button
              onClick={handleImport}
              disabled={isProcessing || !parsedData.length}
              className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2 shadow-lg shadow-teal-500/20"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  Confirm Import
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
