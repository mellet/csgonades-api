export interface TournamentDoc {
  name: string;
  iconUrl: string;
  startDate: Date;
  endDate: Date;
  city: string;
  country: string;
  twitchUrl?: string;
  eventUrl?: string;
}

export interface TournamentModel extends TournamentDoc {
  id: string;
}

export interface TournamentCreateDTO {
  name: string;
  iconUrl: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  twitchUrl?: string;
  eventUrl?: string;
}
