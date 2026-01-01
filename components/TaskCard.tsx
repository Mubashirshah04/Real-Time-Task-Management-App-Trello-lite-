
import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../types';
import { db } from '../services/db';
import { useKanban } from '../context/KanbanContext';
import ConfirmModal from './ConfirmModal';
import TaskDetailModal from './TaskDetailModal';

interface TaskCardProps {
  task: Task;
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const { state, dispatch } = useKanban();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isSelected = state.selectedTaskIds.includes(task.id);

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
      await db.deleteTask(task.id);
    } catch (error: any) {
      console.error('Task delete failed:', error);
      setIsDeleting(false);
    }
  };

  const priorityConfig = {
    high: { 
      bg: 'bg-rose-500/10', 
      text: 'text-rose-400', 
      dot: 'bg-rose-500', 
      border: 'border-rose-500/20'
    },
    medium: { 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-400', 
      dot: 'bg-amber-500', 
      border: 'border-amber-500/20'
    },
    low: { 
      bg: 'bg-emerald-500/10', 
      text: 'text-emerald-400', 
      dot: 'bg-emerald-500', 
      border: 'border-emerald-500/20'
    }
  };

  const priority = task.priority || 'low';
  const config = priorityConfig[priority];

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isOverdue = d < today && d.toDateString() !== today.toDateString();
    return {
      text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isOverdue
    };
  };

  const dueInfo = task.due_date ? formatDate(task.due_date) : null;

  return (
    <>
      <Draggable draggableId={task.id} index={index} isDragDisabled={state.isSelectionMode}>
        {(provided, snapshot) => (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
            onClick={(e) => {
              if (state.isSelectionMode) dispatch({ type: 'TOGGLE_TASK_SELECTION', payload: task.id });
              else setIsDetailOpen(true);
            }}
            className={`group glass p-3 rounded-xl border transition-all duration-200 relative select-none cursor-pointer ${
              isDeleting ? 'opacity-0 scale-95' : ''
            } ${
              isSelected 
              ? 'border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/30' 
              : 'border-white/[0.04] hover:border-white/20 hover:bg-white/[0.02]'
            } ${snapshot.isDragging ? 'rotate-1 shadow-2xl z-50 border-indigo-500/50 bg-slate-900' : ''}`}
          >
            <div className="flex flex-col gap-2">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className={`px-1.5 py-0.5 rounded-md border ${config.bg} ${config.border} flex items-center gap-1`}>
                  <div className={`w-1 h-1 rounded-full ${config.dot}`}></div>
                  <span className={`text-[7px] font-black uppercase tracking-wider ${config.text}`}>{priority}</span>
                </div>
                {!state.isSelectionMode && (
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteModal(true); }} 
                    className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                )}
              </div>

              {/* Title */}
              <h3 className={`text-[12px] font-extrabold leading-tight tracking-tight ${isSelected ? 'text-indigo-300' : 'text-slate-100'}`}>
                {task.title}
              </h3>
              
              {/* Description - Made clearly visible */}
              <div className="min-h-[1rem]">
                <p className={`text-[10px] leading-relaxed line-clamp-2 ${task.description ? 'text-slate-400 font-medium' : 'text-slate-600 italic'}`}>
                  {task.description || "No description."}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-white/[0.03]">
                <div className="flex items-center gap-2">
                  {dueInfo && (
                    <div className={`flex items-center gap-0.5 text-[8px] font-black uppercase ${dueInfo.isOverdue ? 'text-rose-500' : 'text-slate-500'}`}>
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {dueInfo.text}
                    </div>
                  )}
                  {subtasksCount > 0 && (
                    <div className="flex items-center gap-0.5 text-[8px] font-black text-slate-500 uppercase">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
                      {completedSubtasks}/{subtasksCount}
                    </div>
                  )}
                </div>
                <span className="text-[7px] font-black text-slate-800 tracking-widest uppercase">{(task.id).substring(0, 4)}</span>
              </div>
            </div>

            {/* Selection Status Indicator */}
            {state.isSelectionMode && (
              <div className={`absolute -right-1.5 -top-1.5 w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                isSelected ? 'bg-indigo-600 border-white text-white shadow-xl scale-110' : 'bg-slate-950 border-white/10 opacity-60'
              }`}>
                {isSelected && <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={5}><path d="M5 13l4 4L19 7"/></svg>}
              </div>
            )}
          </div>
        )}
      </Draggable>

      <TaskDetailModal 
        task={task} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Discard Archive"
        message={`Confirm termination of "${task.title}".`}
        confirmLabel="Destroy"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default TaskCard;
