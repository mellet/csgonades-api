import { RequestHandler, Router } from "express";
import { Logger } from "../logger/Logger";
import { CsMap } from "../nade/nadeSubTypes/CsgoMap";
import { GameMode } from "../nade/nadeSubTypes/GameMode";
import { NadeType } from "../nade/nadeSubTypes/NadeType";
import { adminOnlyHandler } from "../utils/AuthHandlers";
import { sanitizeIt } from "../utils/Sanitize";
import { AddMapEndLocation, EditMapEndLocation } from "./types/MapEndLocation";
import { MapEndLocationRepo } from "./types/MapEndLocationRepo";
import { MapStartLocationRepoV2 } from "./types/MapStartLocationRepoV2";
import {
  AddMapStartLocationV2,
  EditMapStartLocationV2,
} from "./types/MapStartLocationV2";

type NadeRouterServices = {
  mapStartLocationRepo: MapStartLocationRepoV2;
  mapEndLocationRepo: MapEndLocationRepo;
};

export class MapLocationRouter {
  private router: Router;
  private mapStartLocationRepo: MapStartLocationRepoV2;
  private mapEndLocationRepo: MapEndLocationRepo;

  constructor(services: NadeRouterServices) {
    this.mapStartLocationRepo = services.mapStartLocationRepo;
    this.mapEndLocationRepo = services.mapEndLocationRepo;
    this.router = Router();
    this.setUpRoutes();
  }

  getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/mapstartlocation/:csMap", this.getStartLocation);
    this.router.get("/mapendlocation/:csMap", this.getEndLocation);

    this.router.post(
      "/mapstartlocation/:csMap",
      adminOnlyHandler,
      this.addStartLocation
    );
    this.router.post(
      "/mapendlocation/:csMap",
      adminOnlyHandler,
      this.addEndLocation
    );

    this.router.put(
      "/mapstartlocation/:csMap",
      adminOnlyHandler,
      this.editStartLocation
    );
    this.router.put(
      "/mapendlocation/:csMap",
      adminOnlyHandler,
      this.editEndLocation
    );

    this.router.delete(
      "/mapstartlocation/:csMap/:id",
      adminOnlyHandler,
      this.deleteStartLocation
    );
    this.router.delete(
      "/mapendlocation/:csMap/:id",
      adminOnlyHandler,
      this.deleteEndLocation
    );
  };

  private getStartLocation: RequestHandler = async (req, res) => {
    const csMap = sanitizeIt(req.params.csMap) as CsMap;
    const gameMode = sanitizeIt(req?.query?.gameMode) as GameMode;
    if (!csMap || !gameMode) {
      Logger.error(
        "MapLocationRouter.getStartLocati ->",
        "missing csMap param"
      );
      return res.status(400).send();
    }
    const startLocations =
      await this.mapStartLocationRepo.getNadeStartLocations(csMap, gameMode);

    return res.status(200).send(startLocations);
  };

  private getEndLocation: RequestHandler = async (req, res) => {
    const csMap = sanitizeIt(req.params.csMap) as CsMap;
    const nadeType = sanitizeIt(req.query.nadeType) as NadeType;
    const gameMode = sanitizeIt(req?.query?.gameMode) as GameMode;

    if (!csMap || !nadeType || !gameMode) {
      Logger.error(
        `MapLocationRouter.getEndLocation | Missing csMap or nadeType`
      );
      return res.status(400).send();
    }

    const result = await this.mapEndLocationRepo.getMapEndLocations(
      csMap,
      nadeType,
      gameMode
    );

    return res.status(200).send(result);
  };

  private addStartLocation: RequestHandler = async (req, res) => {
    const startLocation = req.body as AddMapStartLocationV2;
    const result = await this.mapStartLocationRepo.addNadeStartLocation(
      startLocation
    );

    if (!result) {
      Logger.error(`MapLocationRouter.addStartLocation | Error`);
      return res.status(500).send();
    }

    return res.status(201).send(result);
  };

  private addEndLocation: RequestHandler = async (req, res) => {
    const endLocation = req.body as AddMapEndLocation;
    const result = await this.mapEndLocationRepo.save(endLocation);
    if (!result) {
      Logger.error(`MapLocationRouter.addEndLocation | Error`);
      return res.status(500).send();
    }

    return res.status(201).send(result);
  };

  private editStartLocation: RequestHandler = async (req, res) => {
    const startLocationUpdate = req.body as EditMapStartLocationV2;

    const result = await this.mapStartLocationRepo.editNadeStartLocation(
      startLocationUpdate
    );

    if (!result) {
      Logger.error(`MapLocationRouter.editStartLocation | Error`);

      return res.status(500).send();
    }
    return res.status(200).send(result);
  };

  private editEndLocation: RequestHandler = async (req, res) => {
    const endLocationUpdate = req.body as EditMapEndLocation;

    const result = await this.mapEndLocationRepo.edit(endLocationUpdate);

    if (!result) {
      Logger.error(`MapLocationRouter.editEndLocation | Error`);
      return res.status(500).send();
    }

    return res.status(200).send(result);
  };

  private deleteStartLocation: RequestHandler = async (req, res) => {
    const id = req.params.id;

    const result = await this.mapStartLocationRepo.deleteNadeStartLocation(id);

    if (result === "failure") {
      Logger.error(`MapLocationRouter.deleteStartLocation | Error`);
      return res.status(500).send();
    }

    return res.status(200).send();
  };

  private deleteEndLocation: RequestHandler = async (req, res) => {
    const id = req.params.id;

    const result = await this.mapEndLocationRepo.removeById(id);

    if (result === "failure") {
      Logger.error(`MapLocationRouter.deleteEndLocation | Error`);

      return res.status(500).send();
    }

    return res.status(200);
  };
}
