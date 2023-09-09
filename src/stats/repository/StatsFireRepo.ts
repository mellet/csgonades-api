import { collection, Collection, get, update, value } from "typesaurus";
import { Logger } from "../../logger/Logger";
import { GameMode } from "../../nade/nadeSubTypes/GameMode";
import { NadeType } from "../../nade/nadeSubTypes/NadeType";
import { SiteStats } from "../SiteStats";
import { StatsRepo } from "./StatsRepo";

export class StatsFireRepo implements StatsRepo {
  private collection: Collection<SiteStats>;
  private siteDocId = "siteStats";

  private configDoc = "clientConfig";

  constructor() {
    this.collection = collection<SiteStats>("stats");
  }

  getClientConfig = async () => {
    const clientConfig = await get(this.collection, this.configDoc);

    if (!clientConfig) {
      return null;
    }

    Logger.verbose(`StatsRepo.getClientConfig() | DB`);

    return clientConfig.data;
  };

  getStats = async () => {
    const stats = await get(this.collection, this.siteDocId);

    if (!stats) {
      return null;
    }

    Logger.verbose(`StatsRepo.getStats() | DB`);

    return stats.data;
  };

  incrementUserCounter = () => {
    Logger.verbose(`StatsRepo.incrementUserCounter()`);

    return update(this.collection, this.siteDocId, {
      numUsers: value("increment", 1),
    });
  };

  incrementNadeCounter = (nadeType: NadeType, gameMode: GameMode) => {
    Logger.verbose(`StatsRepo.incrementNadeCounter(${nadeType})`);

    switch (nadeType) {
      case "smoke":
        if (gameMode === "csgo") {
          update(this.collection, this.siteDocId, {
            numSmokes: value("increment", 1),
          });
        } else {
          update(this.collection, this.siteDocId, {
            numCs2Smokes: value("increment", 1),
          });
        }
        break;
      case "flash":
        if (gameMode === "csgo") {
          update(this.collection, this.siteDocId, {
            numFlashes: value("increment", 1),
          });
        } else {
          update(this.collection, this.siteDocId, {
            numCs2Flashes: value("increment", 1),
          });
        }
        break;
      case "molotov":
        if (gameMode === "csgo") {
          update(this.collection, this.siteDocId, {
            numMolotovs: value("increment", 1),
          });
        } else {
          update(this.collection, this.siteDocId, {
            numCs2Molotovs: value("increment", 1),
          });
        }

        break;
      case "hegrenade":
        if (gameMode === "csgo") {
          update(this.collection, this.siteDocId, {
            numGrenades: value("increment", 1),
          });
        } else {
          update(this.collection, this.siteDocId, {
            numCs2Grenades: value("increment", 1),
          });
        }
        break;
      default:
        break;
    }

    return update(this.collection, this.siteDocId, {
      numNades: value("increment", 1),
    });
  };

  decrementNadeCounter = (nadeType: NadeType) => {
    Logger.verbose(`StatsRepo.decrementNadeCounter(${nadeType})`);

    switch (nadeType) {
      case "smoke":
        update(this.collection, this.siteDocId, {
          numSmokes: value("increment", -1),
        });
        break;
      case "flash":
        update(this.collection, this.siteDocId, {
          numFlashes: value("increment", -1),
        });
        break;
      case "molotov":
        update(this.collection, this.siteDocId, {
          numMolotovs: value("increment", -1),
        });
        break;
      case "hegrenade":
        update(this.collection, this.siteDocId, {
          numGrenades: value("increment", -1),
        });
        break;
      default:
        break;
    }

    return update(this.collection, this.siteDocId, {
      numNades: value("increment", -1),
    });
  };

  setNadeCount = (
    numSmokes: number,
    numFlashes: number,
    numMolotovs: number,
    numGrenades: number
  ) => {
    Logger.verbose(
      `StatsRepo.setNadeCount(${numSmokes}, ${numFlashes}, ${numMolotovs}, ${numGrenades})`
    );

    const numNades = numSmokes + numFlashes + numMolotovs + numGrenades;

    return update(this.collection, this.siteDocId, {
      numNades,
      numFlashes,
      numGrenades,
      numMolotovs,
      numSmokes,
    });
  };

  setCs2NadeCount = (
    numSmokes: number,
    numFlashes: number,
    numMolotovs: number,
    numGrenades: number
  ) => {
    Logger.verbose(
      `StatsRepo.setCs2NadeCount(${numSmokes}, ${numFlashes}, ${numMolotovs}, ${numGrenades})`
    );
    const numNades = numSmokes + numFlashes + numMolotovs + numGrenades;
    return update(this.collection, this.siteDocId, {
      numCs2Nades: numNades,
      numCs2Flashes: numFlashes,
      numCs2Grenades: numGrenades,
      numCs2Molotovs: numMolotovs,
      numCs2Smokes: numSmokes,
    });
  };
}
