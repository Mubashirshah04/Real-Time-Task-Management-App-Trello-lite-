
import { supabase } from '../supabaseClient';
import { Board, List, Task } from '../types';

export const db = {
  // Boards - Public Fetching
  async fetchBoards() {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Board[];
  },
  async createBoard(title: string) {
    const { data, error } = await supabase
      .from('boards')
      .insert([{ title }]) 
      .select()
      .single();
    if (error) throw error;
    return data as Board;
  },
  async updateBoard(id: string, title: string) {
    const { data, error } = await supabase.from('boards').update({ title }).eq('id', id).select().single();
    if (error) throw error;
    return data as Board;
  },
  async deleteBoard(id: string) {
    const { error } = await supabase.from('boards').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Lists
  async fetchLists(boardId: string) {
    const { data, error } = await supabase.from('lists').select('*').eq('board_id', boardId).order('position');
    if (error) throw error;
    return data as List[];
  },
  async createList(boardId: string, title: string, description: string, position: number) {
    const { data, error } = await supabase.from('lists').insert([{ 
      board_id: boardId, 
      title, 
      description,
      position
    }]).select().single();
    if (error) throw error;
    return data as List;
  },
  async updateList(id: string, updates: Partial<List>) {
    const { data, error } = await supabase.from('lists').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as List;
  },
  async deleteList(id: string) {
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Tasks
  async fetchTasks(boardId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, lists!inner(board_id)')
      .eq('lists.board_id', boardId)
      .order('position');
    if (error) throw error;
    return data as Task[];
  },
  async createTask(listId: string, title: string, description: string, position: number) {
    // CRITICAL: We only insert fields guaranteed to exist in the user's basic schema
    const { data, error } = await supabase.from('tasks').insert([{ 
      list_id: listId, 
      title, 
      description, 
      position
    }]).select().single();
    
    if (error) throw error;
    return data as Task;
  },
  async updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Task;
  },
  async deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  async deleteMultipleTasks(ids: string[]) {
    const { error } = await supabase.from('tasks').delete().in('id', ids);
    if (error) throw error;
    return true;
  }
};
