import { Router, RequestHandler } from "express";
import { TournamentService } from "./TournamentService";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { adminOrModHandler } from "../utils/AuthUtils";
import { TournamentCreateDTO } from "./Tournament";

export class TournamentController {
  private router: Router;
  private tournamentSerivce: TournamentService;

  constructor(tournamentSerivce: TournamentService) {
    this.router = Router();
    this.setUpRoutes();
    this.tournamentSerivce = tournamentSerivce;
  }

  public getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/tournaments", this.getTournaments);
    this.router.post("/tournaments", adminOrModHandler, this.createTournament);
  };

  private getTournaments: RequestHandler = async (_, res) => {
    try {
      const tournaments = await this.tournamentSerivce.getAll();
      return res.status(200).send(tournaments);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private createTournament: RequestHandler = async (req, res) => {
    try {
      const tournament = req.body as TournamentCreateDTO;
      await this.tournamentSerivce.save(tournament);

      return res.status(200).send();
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
