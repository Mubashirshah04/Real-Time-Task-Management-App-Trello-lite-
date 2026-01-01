
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

    return () => { supabase.removeChannel(channel); };
  }, [dispatch]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    try {
      const board = await db.createBoard(newBoardTitle.trim());
      setNewBoardTitle('');
      setIsCreating(false);
      navigate(`/board/${board.id}`);
    } catch (error) { console.error(error); }
  };

  const handleUpdateBoardTitle = async (id: string) => {
    if (!editTitle.trim()) { setEditingBoardId(null); return; }
    try {
      const updated = await db.updateBoard(id, editTitle.trim());
      dispatch({ type: 'UPDATE_BOARD', payload: updated });
      setEditingBoardId(null);
    } catch (error) { console.error(error); }
  };

  const confirmDeleteBoard = async () => {
    const id = showConfirmModal;
    if (!id) return;
    setShowConfirmModal(null);
    setDeletingId(id);
    try {
      dispatch({ type: 'DELETE_BOARD', payload: id });
      await db.deleteBoard(id);
    } catch (error) {
      console.error(error);
      const boards = await db.fetchBoards();
      dispatch({ type: 'SET_BOARDS', payload: boards });
    } finally { setDeletingId(null); }
  };

  return (
    <div className="p-6 md:p-12 lg:p-16 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12 md:mb-16">
        <div className="xl:col-span-2 space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em]">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
            Public Storage Online
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-none italic">
            Command <span className="text-indigo-500">Center</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base md:text-lg max-w-xl font-medium leading-relaxed">
            Distribute your ideas across a high-velocity network. Seamless synchronization across all connected workspaces.
          </p>
        </div>

        <div className="glass p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between border-white/[0.03] group relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Global Insights</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-3xl font-black text-white">{state.boards.length}</span>
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Active Boards</span>
              </div>
              <div>
                <span className="block text-3xl font-black text-white">{state.boards.length * 4}</span>
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Nodes</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsCreating(true)} className="mt-8 w-full bg-white text-slate-950 font-black py-4 rounded-2xl transition-all hover:bg-indigo-600 hover:text-white uppercase tracking-widest text-[10px] shadow-2xl">
            New Workspace
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {isCreating && (
          <div className="bg-white/[0.01] border-2 border-dashed border-white/5 p-8 rounded-[3rem] animate-in zoom-in-95 duration-300">
            <form onSubmit={handleCreateBoard} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest px-1">Protocol Name</label>
                <input autoFocus type="text" placeholder="Workspace ID" className="w-full p-4 bg-slate-900 border border-white/5 text-white rounded-2xl outline-none font-bold text-sm" value={newBoardTitle} onChange={(e) => setNewBoardTitle(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest">Initiate</button>
                <button type="button" onClick={() => setIsCreating(false)} className="px-5 text-slate-500 font-black text-[9px] uppercase tracking-widest">Abort</button>
              </div>
            </form>
          </div>
        )}

        {state.boards.map((board) => (
          <div
            key={board.id}
            onClick={() => editingBoardId !== board.id && navigate(`/board/${board.id}`)}
            className={`group relative glass p-8 md:p-10 rounded-[3rem] shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden flex flex-col min-h-[240px] border-white/[0.02] ${
              deletingId === board.id ? 'opacity-30 scale-95' : 'hover:scale-[1.02] hover:border-indigo-500/40'
            }`}
          >
            <div className="mb-auto">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-500 border border-white/5 shadow-inner transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                </div>
                <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest">S-{(board.id).substring(0,4)}</div>
              </div>
              
              {editingBoardId === board.id ? (
                <input autoFocus className="w-full font-black text-2xl text-white bg-transparent border-b-2 border-indigo-500 outline-none pb-1" value={editTitle} onClick={(e) => e.stopPropagation()} onChange={(e) => setEditTitle(e.target.value)} onBlur={() => handleUpdateBoardTitle(board.id)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateBoardTitle(board.id)} />
              ) : (
                <h2 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tight italic uppercase">{board.title}</h2>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-8">
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setEditingBoardId(board.id); setEditTitle(board.title); }} className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all border border-white/5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2}/></svg></button>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirmModal(board.id); }} className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-rose-500/20 rounded-lg text-slate-700 hover:text-rose-500 transition-all border border-white/5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2}/></svg></button>
              </div>
              <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!showConfirmModal}
        title="Destroy Workspace"
        message="Permanently disconnect this public workspace? This action is irreversible."
        confirmLabel="Destroy"
        onConfirm={confirmDeleteBoard}
        onCancel={() => setShowConfirmModal(null)}
      />
    </div>
  );
};

export default BoardList;
