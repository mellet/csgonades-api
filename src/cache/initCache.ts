import { AppCache, ICache } from "./AppCache";

export type IAppCaches = {
  shorttermCache: ICache;
  longtermCache: ICache;
};

export const initCache = (): IAppCaches => {
  const shorttermCache = new AppCache({ cacheHours: 2 });
  const longtermCache = new AppCache({ cacheHours: 24 });

  return {
    shorttermCache,
    longtermCache,
  };
};
