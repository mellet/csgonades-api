import { Result, err, ok } from "neverthrow";
import { firestore } from "firebase-admin";
import {
  extractFirestoreData,
  extractFirestoreDataPoint
} from "../utils/Firebase";
import { AppResult } from "../utils/Common";
import { ErrorGenerator, extractError } from "../utils/ErrorUtil";
import { ConctactDTO, ContactModel, ContactSaveModel } from "./ContactData";
export class ContactRepo {
  private collection: firestore.CollectionReference;

  constructor(db: FirebaseFirestore.Firestore) {
    const collectionName = "contact";
    this.collection = db.collection(collectionName);
  }

  async addMessage(data: ConctactDTO): AppResult<ContactModel> {
    try {
      const contactModel: Partial<ContactSaveModel> = {
        name: data.name,
        email: data.email,
        message: data.message,
        createdAt: firestore.FieldValue.serverTimestamp()
      };

      const contactDocRef = await this.collection.add(contactModel);
      await contactDocRef.update({ id: contactDocRef.id });
      const contactMessage = await this.getMessage(contactDocRef.id);

      return contactMessage;
    } catch (error) {
      return extractError(error);
    }
  }

  private async getMessage(id: string): AppResult<ContactModel> {
    try {
      const contactSnap = await this.collection.doc(id).get();
      const contactMessage = extractFirestoreDataPoint<ContactModel>(
        contactSnap
      );
      return contactMessage;
    } catch (error) {
      return extractError(error);
    }
  }
}
