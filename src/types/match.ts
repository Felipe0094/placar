
export interface Match {
  id: string;
  group_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  match_time: string;
  status: string; // Mudado para string genérico para compatibilidade com Supabase
  home_score: number | null;
  away_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  country: string;
  logo_url?: string;
}

export interface MatchWithTeams extends Match {
  home_team: Team;
  away_team: Team;
}

// Tipo para os status permitidos
export type MatchStatus = 'upcoming' | 'live' | 'finished';
