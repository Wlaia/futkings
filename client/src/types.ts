export interface Team {
    id: string;
    name: string;
    logoUrl?: string;
}

export interface Match {
    id: string;
    homeTeam: Team;
    awayTeam: Team;
    round: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    startTime?: string;
    homeShootoutScore?: number;
    awayShootoutScore?: number;
}
