import { createClient } from '@supabase/supabase-js';
import { Reservation, MenuItem } from '../types';

// ATENÇÃO: Em um projeto real, use variáveis de ambiente (.env).
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qjommaufbqszimakesfr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb21tYXVmYnFzemltYWtlc2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDgyNzYsImV4cCI6MjA4NTEyNDI3Nn0.wDifnH7REU7CwjT5rZDeXM-ZXWKrWmRAWzddMeyJBtE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_KEY = 'fuego_reservations';

// Connection Status Flag
export let isSystemOffline = false;

// Fallback: LocalStorage Helpers (Garante funcionamento offline/demo)
const getLocalData = (): Reservation[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const setLocalData = (data: Reservation[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

/**
 * Checks if the connection to Supabase is truly working (Table exists + RLS allows access)
 */
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error, count } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.warn("Supabase Connection Check Failed:", error.message);
      isSystemOffline = true;
      return false;
    }
    isSystemOffline = false;
    return true;
  } catch (e) {
    isSystemOffline = true;
    return false;
  }
};

/**
 * --- RESERVATION SERVICES ---
 * Hybrid Approach: Always fetches local data and tries to merge with server data.
 * This prevents data from "disappearing" if the server write failed but local write succeeded.
 */

export const fetchReservations = async (): Promise<Reservation[]> => {
  // 1. Always load local data first (Safety net)
  const localData = getLocalData();
  let serverData: Reservation[] = [];

  // 2. Try to fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      isSystemOffline = false;
      serverData = data.map((item: any) => ({
        id: item.id,
        clientName: item.client_name,
        phone: item.phone || '',
        pax: typeof item.pax === 'number' ? `${item.pax} Pessoas` : (item.pax || '2 Pessoas'),
        time: item.time,
        date: item.date,
        tableType: item.table_type || 'Salão Principal',
        status: item.status,
        createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
      }));
    } else {
      // If error (e.g. table missing), set offline flag but don't crash
      isSystemOffline = true;
    }
  } catch (error) {
    console.warn('Supabase unreachable. Using LocalStorage only.');
    isSystemOffline = true;
  }

  // 3. Merge & Deduplicate
  // We combine both lists. If a reservation exists in both (unlikely given ID generation), we could prefer server.
  // Since Local uses random strings and Server uses UUIDs, they won't collide.
  // This ensures that "Pending Local" items show up alongside "Confirmed Server" items.
  
  const allReservations = [...serverData, ...localData];
  
  // Remove strict duplicates if any (based on ID)
  const uniqueMap = new Map();
  allReservations.forEach(item => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });

  // Return sorted by newest
  return Array.from(uniqueMap.values()).sort((a, b) => b.createdAt - a.createdAt);
};

export const createReservation = async (res: Omit<Reservation, 'id' | 'status' | 'createdAt'>): Promise<Reservation | null> => {
  // Try Supabase First
  try {
    // Parse "2 Pessoas" to integer 2 for DB
    const paxString = res.pax || '2';
    const paxInt = parseInt(paxString.replace(/\D/g, '')) || 2;

    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        client_name: res.clientName,
        phone: res.phone,
        pax: paxInt,
        date: res.date,
        time: res.time,
        table_type: res.tableType,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    // Success on Server
    return {
      id: data.id,
      clientName: data.client_name,
      phone: data.phone,
      pax: `${data.pax} Pessoas`,
      time: data.time,
      date: data.date,
      tableType: data.table_type,
      status: data.status,
      createdAt: new Date(data.created_at).getTime()
    };

  } catch (error) {
    console.warn('Supabase insert failed. Using LocalStorage fallback.', error);
    isSystemOffline = true;
    
    // Fallback: Create locally
    const newReservation: Reservation = {
      id: 'local_' + Math.random().toString(36).substr(2, 9), // Prefix to identify local items easily
      clientName: res.clientName,
      phone: res.phone,
      pax: res.pax, // Keep string for local storage
      time: res.time,
      date: res.date,
      tableType: res.tableType,
      status: 'pending',
      createdAt: Date.now()
    };

    const currentData = getLocalData();
    setLocalData([newReservation, ...currentData]);
    
    return newReservation;
  }
};

export const updateReservationStatusService = async (id: string, status: 'confirmed' | 'cancelled') => {
  // If it's a local ID, only update local storage
  if (id.startsWith('local_')) {
    const currentData = getLocalData();
    const updatedData = currentData.map(r => 
      r.id === id ? { ...r, status } : r
    );
    setLocalData(updatedData);
    return;
  }

  // Try Server Update
  try {
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.warn('Supabase update failed. Using LocalStorage fallback.', error);
    isSystemOffline = true;
    
    // Also update local copy if it exists there for some reason
    const currentData = getLocalData();
    const updatedData = currentData.map(r => 
      r.id === id ? { ...r, status } : r
    );
    setLocalData(updatedData);
  }
};