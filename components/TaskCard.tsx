
import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../types';
import { db } from '../services/db';
import { useKanban } from '../context/KanbanContext';
import ConfirmModal from './ConfirmModal';

interface TaskCardProps {
  task: Task;
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const { state, dispatch } = useKanban();
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
      console.error('Note delete failed:', error);
      setIsDeleting(false);
    }
  };

  const handleOpenDetail = (e: React.MouseEvent) => {
    if (state.isSelectionMode) {
      dispatch({ type: 'TOGGLE_TASK_SELECTION', payload: task.id });
    } else {
      // Trigger global modal in the center of the screen
      dispatch({ type: 'SET_EDITING_TASK', payload: task });
    }
  };

  return (
    <>
      <Draggable draggableId={task.id} index={index} isDragDisabled={state.isSelectionMode}>
        {(provided, snapshot) => (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
            onClick={handleOpenDetail}
            className={`group relative py-5 px-6 border-b border-white/[0.04] transition-all duration-300 select-none cursor-pointer ${
              isDeleting ? 'opacity-0 scale-95' : ''
            } ${
              isSelected 
              ? 'bg-indigo-500/15' 
              : 'bg-transparent hover:bg-white/[0.02]'
            } ${snapshot.isDragging ? 'bg-slate-900 shadow-3xl z-50 rounded-2xl border-white/10 scale-105' : ''}`}
          >
            {/* Minimalist Selection indicator */}
            {isSelected && (
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className={`text-[15px] font-extrabold leading-tight tracking-tight truncate ${
                  isSelected ? 'text-indigo-300' : 'text-slate-100 group-hover:text-white'
                }`}>
                  {task.title}
                </h3>
                
                {!state.isSelectionMode && (
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteModal(true); }} 
                    className="text-slate-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1 shrink-0 bg-white/5 rounded-lg"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
              
              {task.description && (
                <p className="text-[12px] leading-relaxed line-clamp-2 text-slate-400 font-medium group-hover:text-slate-300 transition-all">
                  {task.description}
                </p>
              )}
            </div>

            {/* Selection Checkbox for Selection Mode */}
            {state.isSelectionMode && (
              <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                isSelected ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-transparent border-white/10 opacity-40'
              }`}>
                {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={5}><path d="M5 13l4 4L19 7"/></svg>}
              </div>
            )}
          </div>
        )}
      </Draggable>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Note"
        message={`Confirm permanent destruction of this note record?`}
        confirmLabel="Destroy"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default TaskCard;
