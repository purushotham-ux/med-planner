import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import { toast } from '../stores/toastStore';
import type { Area, ApiResponse } from '../types';
import { MapPin, Plus, Users, ChevronDown, ChevronRight } from 'lucide-react';

export function AreasPage() {
  const queryClient = useQueryClient();
  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState('#3B82F6');
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
    <div className="page-content animate-fade-in pb-nav">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Areas & Beats</h1>
        <button
          onClick={() => setShowAddArea(!showAddArea)}
          className="w-9 h-9 rounded-xl gradient-teal flex items-center justify-center shadow-lg shadow-teal-500/20 min-h-0 min-w-0"
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {showAddArea && (
        <div className="glass rounded-2xl p-4 mb-4 animate-slide-down">
          <h3 className="text-sm font-semibold text-navy-300 mb-3">Add New Area</h3>
          <div className="flex gap-2">
            <input
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="Area name"
              className="form-input flex-1"
            />
            <input
              type="color"
              value={newAreaColor}
              onChange={(e) => setNewAreaColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 min-h-0 min-w-0"
            />
            <button
              onClick={() => addArea.mutate({ name: newAreaName, color: newAreaColor })}
              disabled={!newAreaName.trim()}
              className="px-4 py-2 gradient-teal rounded-xl text-white text-sm font-medium disabled:opacity-50 min-h-0"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {areas?.map((area) => (
            <div key={area.id} className="glass rounded-2xl overflow-hidden card-hover">
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedArea(expandedArea === area.id ? null : area.id)}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${area.color || '#3B82F6'}20` }}
                >
                  <MapPin size={18} style={{ color: area.color || '#3B82F6' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">{area.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-navy-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {area._count?.doctors || 0} doctors
                    </span>
                    <span>{area._count?.beats || 0} beats</span>
                  </div>
                </div>
                {expandedArea === area.id ? (
                  <ChevronDown size={16} className="text-navy-500" />
                ) : (
                  <ChevronRight size={16} className="text-navy-500" />
                )}
              </div>

              {expandedArea === area.id && area.beats && (
                <div className="px-4 pb-4 animate-slide-down">
                  <div className="border-t border-navy-700/30 pt-3 space-y-2">
                    {area.beats.length > 0 ? (
                      area.beats.map((beat) => (
                        <div
                          key={beat.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-xl bg-navy-800/40"
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color || '#3B82F6' }} />
                          <div className="flex-1">
                            <p className="text-xs text-white font-medium">{beat.name}</p>
                            {beat.description && (
                              <p className="text-[10px] text-navy-500">{beat.description}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-navy-400">
                            {(beat as any)._count?.doctors || 0} docs
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-navy-500 text-center py-2">No beats yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
