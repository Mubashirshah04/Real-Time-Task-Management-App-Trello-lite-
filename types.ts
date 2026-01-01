
export interface Board {
  id: string;
  title: string;
  created_at: string;
}

export interface List {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  position: number;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  list_id: string;
  title: string;
  description: string;
  position: number;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  labels: string[];
  subtasks: Subtask[];
}

export type KanbanState = {
  boards: Board[];
  activeBoard: Board | null;
  lists: List[];
  tasks: Task[];
  loading: boolean;
  searchQuery: string;
  filterPriority: TaskPriority | 'all';
  selectedTaskIds: string[];
  isSelectionMode: boolean;
};

export type KanbanAction =
  | { type: 'SET_BOARDS'; payload: Board[] }
  | { type: 'SET_ACTIVE_BOARD'; payload: Board | null }
  | { type: 'SET_LISTS'; payload: List[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_BOARD'; payload: Board }
  | { type: 'UPDATE_BOARD'; payload: Board }
  | { type: 'DELETE_BOARD'; payload: string }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTER_PRIORITY'; payload: TaskPriority | 'all' }
  | { type: 'TOGGLE_TASK_SELECTION'; payload: string }
  | { type: 'SET_SELECTION_MODE'; payload: boolean }
  | { type: 'CLEAR_SELECTION' };
