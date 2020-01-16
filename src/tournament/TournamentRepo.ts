import {
  add,
  collection,
  Collection,
  Doc,
  order,
  query,
  update,
  where
} from "typesaurus";
import { ModelUpdate } from "typesaurus/update";
import { removeUndefines } from "../utils/Common";
import {
  TournamentCreateDTO,
  TournamentDoc,
  TournamentModel
} from "./Tournament";

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

  update = async (id: string, updates: Partial<TournamentCreateDTO>) => {
    let tournamentDoc: ModelUpdate<TournamentDoc> = {
      ...updates,
      endDate: updates.endDate ? new Date(updates.endDate) : undefined,
      startDate: updates.startDate ? new Date(updates.startDate) : undefined
    };

    tournamentDoc = removeUndefines(tournamentDoc);

    await update(this.collection, id, tournamentDoc);
  };

  private toModel = (doc: Doc<TournamentDoc>): TournamentModel => {
    return {
      ...doc.data,
      id: doc.ref.id
    };
  };
}
