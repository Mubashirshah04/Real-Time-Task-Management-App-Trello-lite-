
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKanban } from '../context/KanbanContext';
import { db } from '../services/db';
import { supabase } from '../supabaseClient';
import ConfirmModal from './ConfirmModal';

const BoardList: React.FC = () => {
  const { state, dispatch } = useKanban();
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBoards = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const boards = await db.fetchBoards();
        dispatch({ type: 'SET_BOARDS', payload: boards });
      } catch (error) {
        console.error('Failed to load boards:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadBoards();

    const channel = supabase
      .channel('public:boards:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, (payload) => {
        if (payload.eventType === 'INSERT') dispatch({ type: 'ADD_BOARD', payload: payload.new as any });
        if (payload.eventType === 'UPDATE') dispatch({ type: 'UPDATE_BOARD', payload: payload.new as any });
        if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id || (payload as any).id;
          if (deletedId) dispatch({ type: 'DELETE_BOARD', payload: deletedId });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    try {
      const board = await db.createBoard(newBoardTitle.trim());
      dispatch({ type: 'ADD_BOARD', payload: board });
      setNewBoardTitle('');
      setIsCreating(false);
      navigate(`/board/${board.id}`);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleUpdateBoardTitle = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const updated = await db.updateBoard(id, editTitle.trim());
      dispatch({ type: 'UPDATE_BOARD', payload: updated });
      setEditingBoardId(null);
    } catch (error) {
      console.error('Failed to update board:', error);
    }
  };

  const confirmDeleteBoard = async () => {
    const id = showConfirmModal;
    if (!id) return;
    setShowConfirmModal(null);
    setDeletingId(id);
    try {
      dispatch({ type: 'DELETE_BOARD', payload: id });
      await db.deleteBoard(id);
    } catch (error: any) {
      console.error('Board delete failed:', error);
      const boards = await db.fetchBoards();
      dispatch({ type: 'SET_BOARDS', payload: boards });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 md:p-12 lg:p-16 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
      {/* Premium Dashboard Header */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 mb-20">
        <div className="xl:col-span-2 space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
            Intelligence System Active
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-white tracking-tighter leading-[0.9] italic">
            Command <span className="text-indigo-500">Center</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
            Your distributed project network. Seamlessly transition between workspaces and coordinate high-velocity tasks.
          </p>
        </div>

        <div className="glass p-8 rounded-[3rem] flex flex-col justify-between border-white/[0.03] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Workspace Insights</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-3xl font-black text-white">{state.boards.length}</span>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Boards</span>
              </div>
              <div>
                <span className="block text-3xl font-black text-white">{state.boards.length * 4}+</span>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Tasks Syncing</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-8 group w-full bg-white text-slate-950 font-black py-4 px-8 rounded-2xl transition-all hover:bg-indigo-500 hover:text-white flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] shadow-2xl"
          >
            <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Initialize New Board
          </button>
        </div>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {isCreating && (
          <div className="bg-white/[0.02] border-2 border-dashed border-white/10 p-10 rounded-[3rem] animate-in zoom-in-95 duration-300">
            <form onSubmit={handleCreateBoard} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1 block mb-3">Protocol Name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Board name..."
                  className="w-full p-4 bg-slate-900 border border-white/5 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500">Initiate</button>
                <button type="button" onClick={() => setIsCreating(false)} className="px-6 bg-slate-800 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Abort</button>
              </div>
            </form>
          </div>
        )}

        {state.boards.map((board) => (
          <div
            key={board.id}
            onClick={() => editingBoardId !== board.id && navigate(`/board/${board.id}`)}
            className={`group relative glass p-10 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 cursor-pointer overflow-hidden flex flex-col min-h-[280px] border-white/[0.02] ${
              deletingId === board.id ? 'opacity-30 scale-95' : 'hover:scale-[1.03] hover:border-indigo-500/40 hover:shadow-indigo-500/10'
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="mb-auto">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-white/5 rounded-[1.25rem] flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-white/5 shadow-inner">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ID-{(board.id).substring(0,4)}</div>
              </div>
              
              {editingBoardId === board.id ? (
                <input
                  autoFocus
                  className="w-full font-black text-2xl text-white bg-transparent border-b-2 border-indigo-500 outline-none pb-2 mb-4"
                  value={editTitle}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleUpdateBoardTitle(board.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateBoardTitle(board.id)}
                />
              ) : (
                <h2 className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tighter leading-[1.1] uppercase italic">
                  {board.title}
                </h2>
              )}
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5}/></svg>
                {new Date(board.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-10">
              <div className="flex -space-x-3 items-center">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div>
                ))}
                <span className="ml-5 text-[10px] font-black text-indigo-500">Live</span>
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingBoardId(board.id); setEditTitle(board.title); }}
                  className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirmModal(board.id); }}
                  className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-rose-500/20 rounded-2xl text-slate-500 hover:text-rose-500 transition-all border border-white/5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!showConfirmModal}
        title="Destroy Board Protocol"
        message="This will permanently disconnect this workspace and purge all nested data from the central server. This action cannot be reverted."
        confirmLabel="Finalize Destruction"
        onConfirm={confirmDeleteBoard}
        onCancel={() => setShowConfirmModal(null)}
      />
    </div>
  );
};

export default BoardList;
