
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useKanban } from '../context/KanbanContext';
import { db } from '../services/db';
import { supabase } from '../supabaseClient';
import ListColumn from './ListColumn';
import { List, Task } from '../types';
import ConfirmModal from './ConfirmModal';

const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useKanban();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [showBoardDeleteModal, setShowBoardDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  const listIdsRef = useRef<string[]>([]);
  useEffect(() => {
    listIdsRef.current = state.lists.map(l => l.id);
  }, [state.lists]);

  const loadBoardData = useCallback(async () => {
    if (!boardId) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const boards = await db.fetchBoards();
      dispatch({ type: 'SET_BOARDS', payload: boards });
      
      const currentBoard = boards.find((b) => b.id === boardId);
      if (!currentBoard) {
        navigate('/');
        return;
      }
      dispatch({ type: 'SET_ACTIVE_BOARD', payload: currentBoard });

      const [lists, tasks] = await Promise.all([
        db.fetchLists(boardId),
        db.fetchTasks(boardId),
      ]);
      dispatch({ type: 'SET_LISTS', payload: lists });
      dispatch({ type: 'SET_TASKS', payload: tasks });
    } catch (error) {
      console.error('Error loading board data:', error);
      navigate('/');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [boardId, dispatch, navigate]);

  useEffect(() => {
    loadBoardData();

    const listChannel = supabase
      .channel(`public:lists:${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `board_id=eq.${boardId}` }, (payload) => {
        if (payload.eventType === 'INSERT') dispatch({ type: 'ADD_LIST', payload: payload.new as List });
        if (payload.eventType === 'UPDATE') dispatch({ type: 'UPDATE_LIST', payload: payload.new as List });
        if (payload.eventType === 'DELETE') {
          const id = payload.old?.id || (payload as any).id;
          if (id) dispatch({ type: 'DELETE_LIST', payload: id });
        }
      })
      .subscribe();

    const taskChannel = supabase
      .channel(`public:tasks:${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = payload.old?.id || (payload as any).id;
          if (id) dispatch({ type: 'DELETE_TASK', payload: id });
          return;
        }

        const task = payload.new as Task;
        const belongsToBoard = listIdsRef.current.includes(task.list_id);
        if (!belongsToBoard) return;

        if (payload.eventType === 'INSERT') dispatch({ type: 'ADD_TASK', payload: task });
        if (payload.eventType === 'UPDATE') dispatch({ type: 'UPDATE_TASK', payload: task });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(listChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [boardId, dispatch, loadBoardData]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'list') {
      const newListOrder = Array.from(state.lists);
      const [movedList] = newListOrder.splice(source.index, 1);
      newListOrder.splice(destination.index, 0, movedList);
      const updatedLists = newListOrder.map((l, i) => ({ ...l, position: i }));
      dispatch({ type: 'SET_LISTS', payload: updatedLists });
      await Promise.all(updatedLists.map(l => db.updateList(l.id, { position: l.position })));
      return;
    }

    const destListId = destination.droppableId;
    const taskToMove = state.tasks.find(t => t.id === draggableId);
    if (!taskToMove) return;

    const newTask = { ...taskToMove, list_id: destListId, position: destination.index };
    dispatch({ type: 'UPDATE_TASK', payload: newTask });

    try {
      await db.updateTask(draggableId, { list_id: destListId, position: destination.index });
    } catch (error) {
      console.error('Failed to move task:', error);
      const tasks = await db.fetchTasks(boardId!);
      dispatch({ type: 'SET_TASKS', payload: tasks });
    }
  };

  const confirmBulkDelete = async () => {
    const ids = [...state.selectedTaskIds];
    setShowBulkDeleteModal(false);
    dispatch({ type: 'SET_SELECTION_MODE', payload: false });
    ids.forEach(id => dispatch({ type: 'DELETE_TASK', payload: id }));

    try {
      await db.deleteMultipleTasks(ids);
    } catch (error: any) {
      alert(`Bulk Delete Failed: ${error.message}`);
      loadBoardData();
    }
  };

  const confirmDeleteBoard = async () => {
    if (!boardId) return;
    setShowBoardDeleteModal(false);
    setIsDeletingBoard(true);
    
    try {
      dispatch({ type: 'DELETE_BOARD', payload: boardId });
      navigate('/');
      await db.deleteBoard(boardId);
    } catch (error: any) {
      console.error('Board delete failed:', error);
      alert(`Delete Failed: ${error.message}`);
      setIsDeletingBoard(false);
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      await db.createList(boardId!, newListTitle.trim(), newListDescription.trim(), state.lists.length);
      setNewListTitle('');
      setNewListDescription('');
      setIsAddingList(false);
    } catch (error: any) {
      alert(`Error creating column: ${error.message}`);
    }
  };

  return (
    <div className="h-[calc(100vh-72px)] flex flex-col overflow-hidden animate-in fade-in duration-500">
      {/* Premium Toolbar */}
      <div className="glass px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 shadow-2xl z-50">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-white tracking-tight uppercase italic flex items-center gap-3">
              {state.activeBoard?.title}
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/30 not-italic font-black">BOARD</span>
            </h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Workspace Environment ACTIVE</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search in board..." 
              className="w-full bg-slate-900/50 border border-white/10 text-white text-xs pl-11 pr-4 py-3 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-bold"
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
            />
          </div>

          <div className="h-10 w-px bg-white/5 mx-2 hidden md:block"></div>

          <button 
            onClick={() => dispatch({ type: 'SET_SELECTION_MODE', payload: !state.isSelectionMode })}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              state.isSelectionMode 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 border border-indigo-500' 
              : 'bg-white/5 text-slate-400 hover:text-white border border-white/5 hover:bg-white/10'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {state.isSelectionMode ? 'Mode ON' : 'Selection'}
          </button>

          <button 
            onClick={() => setShowBoardDeleteModal(true)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all group"
            title="Settings"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex items-start gap-8 h-full min-w-max pb-8">
                {state.lists.map((list, index) => (
                  <ListColumn key={list.id} list={list} index={index} />
                ))}
                {provided.placeholder}

                <div className="w-80 shrink-0">
                  {isAddingList ? (
                    <div className="glass p-6 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
                      <form onSubmit={handleAddList} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-1">Column Title</label>
                          <input 
                            autoFocus 
                            className="w-full p-4 bg-white/5 border border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                            placeholder="e.g. In Progress" 
                            value={newListTitle} 
                            onChange={(e) => setNewListTitle(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Description (Optional)</label>
                          <textarea 
                            className="w-full p-4 bg-white/5 border border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-xs resize-none" 
                            placeholder="Objective of this column..." 
                            rows={2}
                            value={newListDescription} 
                            onChange={(e) => setNewListDescription(e.target.value)} 
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">Initiate</button>
                          <button type="button" onClick={() => setIsAddingList(false)} className="px-5 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest">Abort</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingList(true)} 
                      className="w-full flex flex-col items-center justify-center gap-4 py-12 px-6 rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-indigo-500/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-white transition-colors">Add New Column</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {state.selectedTaskIds.length > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 glass px-10 py-6 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex items-center gap-10 z-[100] animate-in slide-in-from-bottom-10 duration-500 border border-indigo-500/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30">
              {state.selectedTaskIds.length}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-sm tracking-tight">Active Selection</span>
              <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Bulk processing available</span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-white/10"></div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowBulkDeleteModal(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-600/20"
            >
              Purge Selected
            </button>
            <button 
              onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
              className="text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest px-4 transition-colors"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showBoardDeleteModal}
        title="Destroy Board"
        message="This is the nuclear option. All data related to this workspace will be wiped from existence. Are you absolutely certain?"
        confirmLabel="Destroy Now"
        onConfirm={confirmDeleteBoard}
        onCancel={() => setShowBoardDeleteModal(false)}
      />

      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Batch Deletion"
        message={`You are about to permanently delete ${state.selectedTaskIds.length} cards from this board. Confirm purge?`}
        confirmLabel="Confirm Purge"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />
    </div>
  );
};

export default BoardView;
