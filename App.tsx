
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { KanbanProvider } from './context/KanbanContext';
import BoardList from './components/BoardList';
import BoardView from './components/BoardView';
import TaskDetailModal from './components/TaskDetailModal';

const Header = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <header className="glass sticky top-0 z-[100] px-4 md:px-8 py-3 flex items-center justify-between border-b border-white/5 shadow-lg">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
        </div>
        <span className="text-lg md:text-xl font-extrabold tracking-tighter text-white">Trello<span className="text-indigo-500">Lite</span></span>
      </Link>
      
      <nav className="flex items-center gap-1">
        <Link 
          to="/" 
          className={`px-3 md:px-5 py-2 rounded-lg text-[9px] md:text-xs font-black uppercase tracking-widest transition-all ${
            isDashboard 
            ? 'bg-white/10 text-white' 
            : 'text-slate-500 hover:text-white'
          }`}
        >
          {isDashboard ? 'Dashboard' : 'Workspaces'}
        </Link>
        <div className="hidden xs:flex w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-600/10 border border-indigo-500/20 items-center justify-center text-indigo-400 ml-2 font-black text-[10px]">
          JD
        </div>
      </nav>
    </header>
  );
};

const App: React.FC = () => {
  return (
    <KanbanProvider>
      <Router>
        <div className="min-h-screen flex flex-col relative">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<BoardList />} />
              <Route path="/board/:boardId" element={<BoardView />} />
            </Routes>
          </main>
          {/* Global Centered Dialog */}
          <TaskDetailModal />
        </div>
      </Router>
    </KanbanProvider>
  );
};

export default App;
