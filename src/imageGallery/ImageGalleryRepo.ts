import { add, all, collection, Collection, Doc } from "typesaurus";
import { ImageDTO, ImageModel } from "./ImageGallery";

export class ImageGalleryRepo {
  private collection: Collection<ImageModel>;

  constructor() {
    this.collection = collection("images");
  }

  getAll = async () => {
    const docs = await all(this.collection);
    const images = docs.map(this.docToDto);

    return images;
  };

  save = async (image: ImageModel) => {
    const doc = await add(this.collection, image);
    return this.docToDto(doc);
  };

  private docToDto = (doc: Doc<ImageModel>): ImageDTO => {
    return {
      ...doc.data,
      id: doc.ref.id
    };
  };
}
