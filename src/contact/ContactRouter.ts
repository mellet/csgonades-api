import { Router } from "express";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { sanitizeIt } from "../utils/Sanitize";
import { ContactDTO } from "./ContactData";
import { ContactRepo } from "./ContactRepo";

export const makeContactRouter = (contactRepo: ContactRepo): Router => {
  const ContactRouter = Router();

  ContactRouter.post("/contact", async (req, res) => {
    try {
      const contactData = sanitizeIt(req.body) as ContactDTO;

      await contactRepo.addMessage(contactData);

      return res.status(201).send();
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  return ContactRouter;
};
