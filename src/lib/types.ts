export interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  category: string;
  notes: string | null;
  date: string;
  user_id: string;
}

export interface Category {
  id: string;
  created_at: string;
  name: string;
  user_id: string;
}

export interface Budget {
  id: string;
  created_at: string;
  category: string;
  limit_amount: number;
  user_id: string;
}

export interface Income {
  id: string;
  created_at: string;
  amount: number;
  source: string;
  date: string;
  user_id: string;
}

export interface AppUser {
  id: string;
  email: string;
}
