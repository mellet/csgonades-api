import joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const envVarSchema = joi
  .object({
    PORT: joi.number().required(),
    STEAM_API_KEY: joi.string().required(),
    SERVER_SECRET: joi.string().required(),
    FIREBASE_CLIENT_EMAIL: joi.string().required(),
    FIREBASE_CLIENT_ID: joi.string().required(),
    FIREBASE_PRIVATE_KEY: joi.string().required()
  })
  .unknown()
  .required();

const { error } = joi.validate(process.env, envVarSchema);

if (error) {
  throw new Error(`Environment not configured correctly: ${error.message}`);
}

export const config = {
  secrets: {
    steam_api_key: process.env.STEAM_API_KEY,
    server_key: process.env.SERVER_SECRET
  },
  server: {
    port: Number(process.env.PORT)
  },
  firebase: {
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    projectId: process.env.FIREBASE_CLIENT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  }
};
