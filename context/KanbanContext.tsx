
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { KanbanState, KanbanAction } from '../types';

const initialState: KanbanState = {
  boards: [],
  activeBoard: null,
  lists: [],
  tasks: [],
  loading: false,
  searchQuery: '',
  filterPriority: 'all',
  selectedTaskIds: [],
  isSelectionMode: false,
};

const kanbanReducer = (state: KanbanState, action: KanbanAction): KanbanState => {
  switch (action.type) {
    case 'SET_BOARDS':
      return { ...state, boards: action.payload };
    case 'SET_ACTIVE_BOARD':
      return { ...state, activeBoard: action.payload };
    case 'SET_LISTS':
      return { ...state, lists: [...action.payload].sort((a, b) => a.position - b.position) };
    case 'SET_TASKS':
      return { ...state, tasks: [...action.payload].sort((a, b) => a.position - b.position) };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'ADD_BOARD':
      return { ...state, boards: [...state.boards, action.payload] };
    case 'UPDATE_BOARD':
      return {
        ...state,
        boards: state.boards.map((b) => (b.id === action.payload.id ? action.payload : b)),
        activeBoard: state.activeBoard?.id === action.payload.id ? action.payload : state.activeBoard
      };
    case 'DELETE_BOARD':
      return { 
        ...state, 
        boards: state.boards.filter((b) => b.id !== action.payload),
        lists: [],
        tasks: [],
        activeBoard: state.activeBoard?.id === action.payload ? null : state.activeBoard
      };
    case 'ADD_LIST':
      return { ...state, lists: [...state.lists, action.payload].sort((a, b) => a.position - b.position) };
    case 'UPDATE_LIST':
      return {
        ...state,
        lists: state.lists.map((l) => (l.id === action.payload.id ? action.payload : l)).sort((a, b) => a.position - b.position)
      };
    case 'DELETE_LIST':
      return { 
        ...state, 
        lists: state.lists.filter((l) => l.id !== action.payload),
        tasks: state.tasks.filter((t) => t.list_id !== action.payload)
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload].sort((a, b) => a.position - b.position) };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)).sort((a, b) => a.position - b.position)
      };
    case 'DELETE_TASK':
      return { 
        ...state, 
        tasks: state.tasks.filter((t) => t.id !== action.payload),
        selectedTaskIds: state.selectedTaskIds.filter(id => id !== action.payload)
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTER_PRIORITY':
      return { ...state, filterPriority: action.payload };
    case 'SET_SELECTION_MODE':
      return { ...state, isSelectionMode: action.payload, selectedTaskIds: action.payload ? state.selectedTaskIds : [] };
    case 'TOGGLE_TASK_SELECTION':
      const isSelected = state.selectedTaskIds.includes(action.payload);
      return {
        ...state,
        selectedTaskIds: isSelected 
          ? state.selectedTaskIds.filter(id => id !== action.payload)
          : [...state.selectedTaskIds, action.payload]
      };
    case 'CLEAR_SELECTION':
      return { ...state, selectedTaskIds: [] };
    default:
      return state;
  }
};

const KanbanContext = createContext<{
  state: KanbanState;
  dispatch: React.Dispatch<KanbanAction>;
} | undefined>(undefined);

export const KanbanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);

  return (
    <KanbanContext.Provider value={{ state, dispatch }}>
      {children}
    </KanbanContext.Provider>
  );
};

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) throw new Error('useKanban must be used within a KanbanProvider');
  return context;
};
