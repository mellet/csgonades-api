import { collection, Collection, get, update, value } from "typesaurus";
import { SiteStats } from "./SiteStats";

export class StatsRepo {
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
      numUsers: value("increment", 1)
    });
  };

  incrementNadeCounter = () => {
    return update(this.collection, this.siteDocId, {
      numNades: value("increment", 1)
    });
  };

  decrementNadeCounter = () => {
    return update(this.collection, this.siteDocId, {
      numNades: value("increment", -1)
    });
  };

  incrementPendingCounter = () => {
    return update(this.collection, this.siteDocId, {
      numPending: value("increment", 1)
    });
  };

  decrementPendingCounter = () => {
    return update(this.collection, this.siteDocId, {
      numPending: value("increment", -1)
    });
  };
}
