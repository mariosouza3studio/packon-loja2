import { create } from 'zustand';

interface SearchState {
  isOpen: boolean;
  query: string;
  results: any[];
  loading: boolean;
  
  setIsOpen: (status: boolean) => void;
  setQuery: (term: string) => void;
  setResults: (data: any[]) => void;
  setLoading: (status: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: '',
  results: [],
  loading: false,

  setIsOpen: (status) => set({ isOpen: status }),
  setQuery: (term) => set({ query: term }),
  setResults: (data) => set({ results: data }),
  setLoading: (status) => set({ loading: status }),
}));