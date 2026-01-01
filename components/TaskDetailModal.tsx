
import React, { useState } from 'react';
import { Task, TaskPriority, Subtask } from '../types';
import { db } from '../services/db';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority || 'low');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [labels, setLabels] = useState<string[]>(task.labels || []);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await db.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
        labels,
        subtasks
      });
      onClose();
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSub: Subtask = {
      id: crypto.randomUUID(),
      text: newSubtaskText.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskText('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const toggleLabel = (label: string) => {
    if (labels.includes(label)) setLabels(labels.filter(l => l !== label));
    else setLabels([...labels, label]);
  };

  const availableLabels = ['Feature', 'Bug', 'UI/UX', 'Research', 'Design'];
  const priorityOptions: { label: string; value: TaskPriority; color: string; border: string; text: string }[] = [
    { label: 'High', value: 'high', color: 'bg-rose-500', border: 'border-rose-500/30', text: 'text-rose-400' },
    { label: 'Medium', value: 'medium', color: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-400' },
    { label: 'Low', value: 'low', color: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl transition-opacity duration-700" 
        onClick={onClose} 
      />
      <div className="relative glass border-white/10 w-full max-w-5xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Main Workspace Area */}
          <div className="flex-1 p-8 lg:p-14 space-y-10 overflow-y-auto max-h-[85vh] custom-scrollbar">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Task Intel • #{task.id.substring(0, 8)}
              </div>
              <input 
                className="w-full font-black text-3xl md:text-5xl bg-transparent border-none outline-none text-white placeholder:text-slate-800 tracking-tighter italic" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Initialize Protocol..."
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Detailed Logs</label>
              <textarea 
                className="w-full text-base p-7 bg-white/[0.03] border border-white/[0.05] rounded-[2.5rem] resize-none outline-none text-slate-300 focus:border-indigo-500/50 transition-all leading-relaxed min-h-[180px] placeholder:text-slate-700 font-medium" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Synchronize objective data points..." 
              />
            </div>

            {/* Checklist Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" strokeWidth={2.5}/></svg>
                  Tactical Checklist
                </label>
                <span className="text-[10px] font-bold text-indigo-400">{subtasks.filter(s => s.completed).length}/{subtasks.length} Completed</span>
              </div>
              
              <div className="space-y-3">
                {subtasks.map((sub) => (
                  <div key={sub.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <button 
                      onClick={() => toggleSubtask(sub.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        sub.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-white/10 text-transparent'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7"/></svg>
                    </button>
                    <span className={`flex-1 text-sm font-bold transition-all ${sub.completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                      {sub.text}
                    </span>
                    <button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-rose-500 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg>
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-3">
                  <input 
                    className="flex-1 p-4 bg-slate-950/50 border border-white/5 rounded-2xl outline-none text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500"
                    placeholder="Add new objective..."
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  />
                  <button onClick={addSubtask} className="px-6 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Add</button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Metadata Command */}
          <div className="w-full lg:w-96 bg-white/[0.01] border-l border-white/[0.05] p-8 lg:p-14 space-y-12">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Priority Class</label>
              <div className="flex flex-col gap-3">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    className={`px-5 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-between group ${
                      priority === opt.value 
                      ? `${opt.border} bg-white/[0.05] ${opt.text} shadow-xl scale-105` 
                      : 'bg-transparent text-slate-600 border-white/[0.03] hover:border-white/10 hover:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${priority === opt.value ? opt.color : 'bg-slate-800'}`}></div>
                      {opt.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Label Taxonomy</label>
              <div className="flex flex-wrap gap-2">
                {availableLabels.map((l) => (
                  <button
                    key={l}
                    onClick={() => toggleLabel(l)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                      labels.includes(l) 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Deadline Horizon</label>
              <div className="relative group">
                <input 
                  type="date"
                  className="w-full p-5 bg-white/[0.03] border border-white/[0.05] rounded-2xl outline-none text-white focus:border-indigo-500/50 font-bold text-xs appearance-none custom-date-input" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
              </div>
            </div>

            <div className="pt-10 space-y-6 border-t border-white/[0.03]">
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full bg-white text-slate-950 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-indigo-600 hover:text-white shadow-[0_20px_50px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'SYNCING...' : 'COMMIT CHANGES'}
              </button>
              <button onClick={onClose} className="w-full text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-colors">Discard Draft</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
