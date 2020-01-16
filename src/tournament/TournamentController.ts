import { RequestHandler, Router } from "express";
import { adminOrModHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { TournamentCreateDTO } from "./Tournament";
import { TournamentService } from "./TournamentService";

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
    this.router.patch("/tournaments", adminOrModHandler, this.updateTournament);
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

  private updateTournament: RequestHandler = async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body as Partial<TournamentCreateDTO>;
      await this.tournamentSerivce.update(id, updates);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
