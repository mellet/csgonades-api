import { NadeModel, NadeLightDTO, NadeDTO } from "./Nade";
import { removeUndefines } from "../utils/Common";

export const nadeModelsToLightDTO = (nades: NadeModel[]): NadeLightDTO[] => {
  const lightNades = nades.map(nadeModel => {
    const nadeLight: NadeLightDTO = {
      id: nadeModel.id,
      title: nadeModel.title,
      gfycat: nadeModel.gfycat,
      createdAt: nadeModel.createdAt.toDate(),
      images: nadeModel.images,
      tickrate: nadeModel.tickrate,
      type: nadeModel.type,
      stats: nadeModel.stats
    };

    return removeUndefines(nadeLight);
  });

  return lightNades;
};

export const nadeDTOfromModel = (nade: NadeModel): NadeDTO => {
  const dto: NadeDTO = {
    id: nade.id,
    title: nade.title,
    createdAt: nade.createdAt.toDate(),
    gfycat: nade.gfycat,
    images: nade.images,
    stats: nade.stats,
    status: nade.status,
    steamId: nade.steamId,
    updatedAt: nade.updatedAt.toDate(),
    user: nade.user,
    description: nade.description,
    map: nade.map,
    movement: nade.movement,
    statusInfo: nade.statusInfo,
    technique: nade.technique,
    tickrate: nade.tickrate,
    type: nade.type
  };
  return removeUndefines(dto);
};
