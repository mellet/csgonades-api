import { Router } from "express";
import { sanitizeIt } from "../utils/Sanitize";
import { ContactRepo } from "./ContactRepo";
import { ConctactDTO } from "./ContactData";

export const makeContactRouter = (contactRepo: ContactRepo): Router => {
  const ContactRouter = Router();

  ContactRouter.post("/contact", async (req, res) => {
    const contactData = sanitizeIt(req.body) as ConctactDTO;

    const result = await contactRepo.addMessage(contactData);

    if (result.isErr()) {
      return res
        .status(500)
        .send({ status: 500, message: "Failed to send contact form" });
    }

    return res.status(201).send();
  });

  return ContactRouter;
};
