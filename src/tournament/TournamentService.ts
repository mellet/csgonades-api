import { TournamentRepo } from "./TournamentRepo";
import { TournamentModel, TournamentCreateDTO } from "./Tournament";

export class TournamentService {
  private tournamentRepo: TournamentRepo;
  constructor(tournamentRepo: TournamentRepo) {
    this.tournamentRepo = tournamentRepo;
  }

  getAll = async (): Promise<TournamentModel[]> => {
    return this.tournamentRepo.getAll();
  };

  save = async (tournament: TournamentCreateDTO) => {
    return this.tournamentRepo.save(tournament);
  };
}
