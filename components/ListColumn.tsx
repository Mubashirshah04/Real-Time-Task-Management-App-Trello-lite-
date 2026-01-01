
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
  const [editDesc, setEditDesc] = useState(list.description || '');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const filteredTasks = state.tasks
    .filter((task) => {
      const matchBoard = task.list_id === list.id;
      const matchSearch = task.title.toLowerCase().includes(state.searchQuery.toLowerCase());
      return matchBoard && matchSearch;
    })
    .sort((a, b) => a.position - b.position);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const position = state.tasks.filter(t => t.list_id === list.id).length;
      await db.createTask(list.id, newTaskTitle.trim(), '', position);
      setNewTaskTitle('');
      setIsAddingTask(false);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleUpdateMetadata = async () => {
    try {
      await db.updateList(list.id, { 
        title: editTitle.trim(), 
        description: editDesc.trim() 
      });
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
            <div className="flex flex-col max-h-full glass rounded-2xl overflow-hidden group relative border-white/[0.03] shadow-lg">
              {/* Column Header */}
              <div 
                {...provided.dragHandleProps} 
                className={`p-4 flex flex-col gap-1.5 bg-white/[0.01] border-b border-white/[0.03] ${isEditingMetadata ? 'ring-1 ring-inset ring-indigo-500/30' : ''}`}
              >
                {isEditingMetadata ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input 
                      autoFocus 
                      className="bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-white outline-none w-full" 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)} 
                    />
                    <div className="flex gap-2">
                      <button onClick={handleUpdateMetadata} className="flex-1 bg-white text-slate-950 text-[9px] py-1 rounded-md font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Save</button>
                      <button onClick={() => setIsEditingMetadata(false)} className="px-2 text-slate-500 text-[9px] font-bold uppercase hover:text-white">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <h2 
                        onClick={() => setIsEditingMetadata(true)} 
                        className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate cursor-pointer hover:text-white"
                      >
                        {list.title}
                      </h2>
                      <span className="shrink-0 text-[10px] font-bold text-slate-600 bg-white/5 px-1.5 rounded-md">
                        {filteredTasks.length}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteModal(true); }} 
                      className="text-slate-700 hover:text-rose-500 p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Tasks Area - Reduced Padding */}
              <Droppable droppableId={list.id} type="task">
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className={`flex-1 p-3 min-h-[50px] overflow-y-auto space-y-3 custom-scrollbar transition-all ${
                      snapshot.isDraggingOver ? 'bg-indigo-500/[0.03]' : ''
                    }`}
                  >
                    {filteredTasks.map((task, idx) => (
                      <TaskCard key={task.id} task={task} index={idx} />
                    ))}
                    {provided.placeholder}
                    {filteredTasks.length === 0 && !isAddingTask && (
                      <div className="py-6 flex flex-col items-center justify-center opacity-10">
                        <span className="text-[8px] font-black uppercase tracking-widest">Idle</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Footer */}
              <div className="p-3 bg-white/[0.01] border-t border-white/[0.02]">
                {isAddingTask ? (
                  <form onSubmit={handleAddTask} className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <input 
                      autoFocus 
                      placeholder="Title..." 
                      className="w-full p-2 text-[11px] bg-slate-950/60 border border-white/5 text-white rounded-lg focus:ring-1 focus:ring-indigo-600 outline-none font-medium" 
                      value={newTaskTitle} 
                      onChange={(e) => setNewTaskTitle(e.target.value)} 
                    />
                    <div className="flex gap-1.5">
                      <button type="submit" className="flex-1 bg-white text-slate-950 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Create</button>
                      <button type="button" onClick={() => setIsAddingTask(false)} className="px-2 text-slate-500 hover:text-white text-[9px] font-bold uppercase transition-colors">Exit</button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => setIsAddingTask(true)} 
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-all text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
                    New Card
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Purge Column"
        message="Delete column and its records?"
        confirmLabel="Purge"
        onConfirm={confirmDeleteList}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default ListColumn;
