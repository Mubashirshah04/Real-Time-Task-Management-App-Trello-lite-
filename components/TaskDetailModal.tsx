
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/db';
import { useKanban } from '../context/KanbanContext';

const TaskDetailModal: React.FC = () => {
  const { state, dispatch } = useKanban();
  const task = state.editingTask;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync internal state when the active task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
    }
  }, [task]);

  if (!task) return null;

  const handleClose = () => dispatch({ type: 'SET_EDITING_TASK', payload: null });

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const updated = await db.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
      });
      dispatch({ type: 'UPDATE_TASK', payload: updated });
      handleClose();
    } catch (error: any) { 
      alert(`Sync failed: ${error.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10">
      {/* Dark Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity duration-500" 
        onClick={handleClose} 
      />
      
      {/* Simplified Wide Dialog Container */}
      <div className="relative glass border-white/10 w-full max-w-4xl rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header - Simple Close Button */}
        <div className="flex justify-end p-6">
          <button 
            onClick={handleClose}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-all border border-white/5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-16 pt-0">
          <div className="max-w-3xl mx-auto space-y-12">
            
            {/* Title Section */}
            <div className="space-y-2">
              <input 
                autoFocus
                className="w-full font-black text-4xl md:text-6xl bg-transparent border-none outline-none text-white placeholder:text-slate-900 tracking-tighter italic selection:bg-indigo-500/30" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Title..."
              />
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <textarea 
                className="w-full text-lg md:text-xl p-0 bg-transparent border-none resize-none outline-none text-slate-300 focus:text-white transition-all leading-relaxed min-h-[400px] font-medium selection:bg-indigo-500/20" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Description details..." 
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-10">
              <button 
                onClick={handleSave} 
                disabled={loading} 
                className="flex-1 bg-white text-slate-950 py-6 rounded-[2rem] font-black text-[14px] uppercase tracking-[0.4em] hover:bg-indigo-600 hover:text-white transition-all shadow-2xl disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={handleClose} 
                className="px-10 text-slate-500 hover:text-white text-[12px] font-black uppercase tracking-widest transition-colors py-6"
              >
                Discard
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TaskDetailModal;
