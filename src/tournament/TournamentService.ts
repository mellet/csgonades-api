import { CachingService } from "../services/CachingService";
import { TournamentCreateDTO, TournamentModel } from "./Tournament";
import { TournamentRepo } from "./TournamentRepo";

export class TournamentService {
  private tournamentRepo: TournamentRepo;
  private cache: CachingService;

  constructor(tournamentRepo: TournamentRepo, cache: CachingService) {
    this.tournamentRepo = tournamentRepo;
    this.cache = cache;
  }

  getAll = async (): Promise<TournamentModel[]> => {
    const cacheResult = this.cache.getTournaments();
    if (cacheResult) {
      return cacheResult;
    }

    const tournaments = await this.tournamentRepo.getAll();

    this.cache.setTournaments(tournaments);

    return tournaments;
  };

  save = async (tournament: TournamentCreateDTO) => {
    this.cache.flushTournaments();
    return this.tournamentRepo.save(tournament);
  };

  update = async (id: string, updates: Partial<TournamentCreateDTO>) => {
    await this.tournamentRepo.update(id, updates);
    this.cache.flushTournaments();
  };
}
