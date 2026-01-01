
import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { List, Task } from '../types';
import { useKanban } from '../context/KanbanContext';
import { db } from '../services/db';
import TaskCard from './TaskCard';
import ConfirmModal from './ConfirmModal';

interface ListColumnProps {
  list: List;
  index: number;
}

const ListColumn: React.FC<ListColumnProps> = ({ list, index }) => {
  const { state, dispatch } = useKanban();
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const filteredTasks = state.tasks
    .filter((task) => {
      const matchBoard = task.list_id === list.id;
      const matchSearch = task.title.toLowerCase().includes(state.searchQuery.toLowerCase());
      return matchBoard && matchSearch;
    })
    .sort((a, b) => a.position - b.position);

  const handleOpenNewNoteModal = async () => {
    try {
      const position = state.tasks.filter(t => t.list_id === list.id).length;
      // Create a skeleton note in DB so we can open it in the editor
      const newTask = await db.createTask(list.id, 'New Note', '', position);
      dispatch({ type: 'ADD_TASK', payload: newTask });
      // Trigger the global editor
      dispatch({ type: 'SET_EDITING_TASK', payload: newTask });
    } catch (error: any) {
      console.error('Error initiating note:', error);
      alert(`Error: ${error.message || 'Check your database connection/schema'}`);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!editTitle.trim()) {
      setEditTitle(list.title);
      setIsEditingMetadata(false);
      return;
    }
    try {
      const updated = await db.updateList(list.id, { title: editTitle.trim() });
      dispatch({ type: 'UPDATE_LIST', payload: updated });
      setIsEditingMetadata(false);
    } catch (error: any) {
      alert(`Update failed: ${error.message}`);
    }
  };

  const confirmDeleteList = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try { 
      dispatch({ type: 'DELETE_LIST', payload: list.id });
      await db.deleteList(list.id); 
    } catch (error: any) { 
      alert(`Delete Failed: ${error.message}`);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Draggable draggableId={list.id} index={index}>
        {(provided) => (
          <div 
            {...provided.draggableProps} 
            ref={provided.innerRef} 
            className={`w-[280px] shrink-0 flex flex-col max-h-full transition-all duration-300 ${isDeleting ? 'opacity-0 scale-95' : ''}`}
          >
            <div className="flex flex-col max-h-full glass rounded-[2rem] overflow-hidden group relative transition-all duration-500">
              {/* Column Header */}
              <div 
                {...provided.dragHandleProps} 
                className="px-6 py-5 flex items-center justify-between border-b border-white/[0.03]"
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  {isEditingMetadata ? (
                    <input 
                      autoFocus 
                      className="bg-transparent text-[11px] font-black text-white outline-none w-full uppercase tracking-widest italic" 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleUpdateMetadata}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateMetadata()}
                    />
                  ) : (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <h2 
                        onClick={() => setIsEditingMetadata(true)} 
                        className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] truncate cursor-pointer hover:text-white transition-colors"
                      >
                        {list.title}
                      </h2>
                      <span className="text-[9px] font-bold text-slate-800">
                        {filteredTasks.length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={handleOpenNewNoteModal} 
                    className="p-1.5 text-slate-500 hover:text-indigo-400 transition-all hover:scale-110"
                    title="Add Note"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M12 4v16m8-8H4" /></svg>
                  </button>
                  <button 
                    onClick={() => setShowDeleteModal(true)} 
                    className="p-1.5 text-slate-800 hover:text-rose-500 transition-all"
                    title="Delete Stack"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Notes Stream Area */}
              <Droppable droppableId={list.id} type="task">
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className={`flex-1 overflow-y-auto custom-scrollbar transition-all ${
                      snapshot.isDraggingOver ? 'bg-white/[0.01]' : ''
                    }`}
                  >
                    {filteredTasks.map((task, idx) => (
                      <TaskCard key={task.id} task={task} index={idx} />
                    ))}
                    {provided.placeholder}
                    
                    {filteredTasks.length === 0 && (
                      <div className="py-20 flex flex-col items-center justify-center opacity-[0.03] select-none pointer-events-none px-6 text-center">
                         <svg className="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Empty Stack</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        )}
      </Draggable>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Stack"
        message="This will remove this entire collection of notes permanently."
        confirmLabel="Confirm Delete"
        onConfirm={confirmDeleteList}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default ListColumn;
