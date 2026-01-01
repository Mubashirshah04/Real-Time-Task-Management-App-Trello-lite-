
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { KanbanProvider } from './context/KanbanContext';
import BoardList from './components/BoardList';
import BoardView from './components/BoardView';

const Header = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <header className="glass sticky top-0 z-[100] px-6 py-4 flex items-center justify-between border-b border-white/5">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform duration-300">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span className="text-xl font-extrabold tracking-tighter text-white">Trello<span className="text-indigo-500">Lite</span></span>
      </Link>
      
      <nav className="flex items-center gap-2">
        <Link 
          to="/" 
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
            isDashboard 
            ? 'bg-white/10 text-white border border-white/10' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          My Workspaces
        </Link>
        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 ml-4 font-bold text-xs">
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
        </div>
      </Router>
    </KanbanProvider>
  );
};

export default App;
