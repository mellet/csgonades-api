import {
  collection,
  add,
  Collection,
  query,
  Doc,
  where,
  order
} from "typesaurus";
import {
  TournamentDoc,
  TournamentModel,
  TournamentCreateDTO
} from "./Tournament";
import { removeUndefines } from "../utils/Common";

export class TournamentRepo {
  private collection: Collection<TournamentDoc>;

  constructor() {
    this.collection = collection<TournamentDoc>("tournaments");
  }

  getAll = async (): Promise<TournamentModel[]> => {
    const tournamentDocs = await query(this.collection, [
      where("endDate", ">=", new Date()),
      order("endDate", "asc")
    ]);

    const tournaments = tournamentDocs.map(this.toModel);
    return tournaments;
  };

  save = async (tournament: TournamentCreateDTO) => {
    let tournamentDoc: TournamentDoc = {
      ...tournament,
      startDate: new Date(tournament.startDate),
      endDate: new Date(tournament.endDate)
    };

    tournamentDoc = removeUndefines(tournamentDoc);

    const res = await add(this.collection, tournamentDoc);

    return {
      ...res.data,
      id: res.ref.id
    };
  };

  private toModel = (doc: Doc<TournamentDoc>): TournamentModel => {
    return {
      ...doc.data,
      id: doc.ref.id
    };
  };
}
