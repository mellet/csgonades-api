import { collection, Collection, get, update, value } from "typesaurus";
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

    return clientConfig.data;
  };

  getStats = async () => {
    const stats = await get(this.collection, this.siteDocId);

    if (!stats) {
      return null;
    }

    return stats.data;
  };

  incrementUserCounter = () => {
    return update(this.collection, this.siteDocId, {
      numUsers: value("increment", 1),
    });
  };

  incrementNadeCounter = (nadeType: NadeType) => {
    switch (nadeType) {
      case "smoke":
        update(this.collection, this.siteDocId, {
          numSmokes: value("increment", 1),
        });
        break;
      case "flash":
        update(this.collection, this.siteDocId, {
          numFlashes: value("increment", 1),
        });
        break;
      case "molotov":
        update(this.collection, this.siteDocId, {
          numMolotovs: value("increment", 1),
        });
        break;
      case "hegrenade":
        update(this.collection, this.siteDocId, {
          numGrenades: value("increment", 1),
        });
        break;
      default:
        break;
    }

    return update(this.collection, this.siteDocId, {
      numNades: value("increment", 1),
    });
  };

  decrementNadeCounter = (nadeType: NadeType) => {
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
    const numNades = numSmokes + numFlashes + numMolotovs + numGrenades;

    return update(this.collection, this.siteDocId, {
      numNades,
      numFlashes,
      numGrenades,
      numMolotovs,
      numSmokes,
    });
  };
}
