
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
      const [boards, lists, tasks] = await Promise.all([
        db.fetchBoards(),
        db.fetchLists(boardId),
        db.fetchTasks(boardId),
      ]);
      
      dispatch({ type: 'SET_BOARDS', payload: boards });
      const currentBoard = boards.find((b) => b.id === boardId);
      if (!currentBoard) { navigate('/'); return; }
      dispatch({ type: 'SET_ACTIVE_BOARD', payload: currentBoard });
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
    try { await db.deleteMultipleTasks(ids); } catch (error: any) { alert(`Purge Failed: ${error.message}`); loadBoardData(); }
  };

  const confirmDeleteBoard = async () => {
    if (!boardId) return;
    setShowBoardDeleteModal(false);
    try { navigate('/'); await db.deleteBoard(boardId); } catch (error: any) { alert(`Delete Failed: ${error.message}`); }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      await db.createList(boardId!, newListTitle.trim(), newListDescription.trim(), state.lists.length);
      setNewListTitle('');
      setNewListDescription('');
      setIsAddingList(false);
    } catch (error: any) { alert(`Error: ${error.message}`); }
  };

  return (
    <div className="h-[calc(100vh-68px)] flex flex-col overflow-hidden">
      {/* Responsive Toolbar */}
      <div className="glass px-4 md:px-8 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 shadow-2xl z-[60]">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          
          <div className="flex flex-col min-w-0">
            <h1 className="text-base md:text-xl font-black text-white tracking-tight uppercase italic truncate flex items-center gap-2">
              {state.activeBoard?.title}
              <span className="hidden xs:inline-block text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/30 not-italic font-black">BOARD</span>
            </h1>
            <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5 truncate">Workspace Environment ACTIVE</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 no-scrollbar">
          <div className="relative flex-1 sm:w-64 md:w-80 group shrink-0">
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-slate-900/50 border border-white/10 text-white text-xs pl-11 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-bold"
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
            />
          </div>

          <button 
            onClick={() => dispatch({ type: 'SET_SELECTION_MODE', payload: !state.isSelectionMode })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
              state.isSelectionMode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 text-slate-500 border-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/></svg>
            <span className="hidden md:inline">Selection</span>
          </button>

          <button 
            onClick={() => setShowBoardDeleteModal(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-600 hover:text-rose-500 shrink-0 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth p-6 md:p-8 custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex items-start gap-6 md:gap-8 h-full min-w-max pb-8">
                {state.lists.map((list, index) => (
                  <div key={list.id} className="snap-center">
                    <ListColumn list={list} index={index} />
                  </div>
                ))}
                {provided.placeholder}

                <div className="w-[280px] md:w-80 shrink-0 snap-center">
                  {isAddingList ? (
                    <div className="glass p-6 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
                      <form onSubmit={handleAddList} className="space-y-4">
                        <input 
                          autoFocus 
                          className="w-full p-4 bg-white/5 border border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" 
                          placeholder="Column Title" 
                          value={newListTitle} 
                          onChange={(e) => setNewListTitle(e.target.value)} 
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Add</button>
                          <button type="button" onClick={() => setIsAddingList(false)} className="px-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Abort</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingList(true)} 
                      className="w-full flex flex-col items-center justify-center gap-3 py-16 px-6 rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-indigo-500/30 bg-white/[0.01] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 4v16m8-8H4"/></svg>
                      </div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">New Column</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {state.selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl flex items-center gap-6 z-[100] border border-indigo-500/50 scale-90 md:scale-100 origin-bottom">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">{state.selectedTaskIds.length}</div>
            <span className="text-white font-black text-xs hidden xs:block uppercase tracking-widest">Selected</span>
          </div>
          <button 
            onClick={() => setShowBulkDeleteModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Purge
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={showBoardDeleteModal}
        title="Destroy Board"
        message="Permanently wipe this workspace and all associated data from the network?"
        confirmLabel="Destroy Now"
        onConfirm={confirmDeleteBoard}
        onCancel={() => setShowBoardDeleteModal(false)}
      />

      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Batch Purge"
        message={`Delete ${state.selectedTaskIds.length} records permanently?`}
        confirmLabel="Confirm Purge"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />
    </div>
  );
};

export default BoardView;
