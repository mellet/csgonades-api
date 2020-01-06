import Joi from "@hapi/joi";
import dotenv from "dotenv";

dotenv.config();

const envVarSchema = Joi.object({
  PORT: Joi.number().required(),
  STEAM_API_KEY: Joi.string().required(),
  SERVER_SECRET: Joi.string().required(),
  FIREBASE_CLIENT_EMAIL: Joi.string().required(),
  FIREBASE_CLIENT_ID: Joi.string().required(),
  FIREBASE_PRIVATE_KEY: Joi.string().required(),
  GFYCAT_ID: Joi.string().required(),
  GFYCAT_SECRET: Joi.string().required(),
  SENTRY_DSN: Joi.string().required()
})
  .unknown()
  .required();

export type CSGNConfig = {
  isProduction: boolean;
  secrets: {
    steam_api_key: string;
    server_key: string;
    gfycat_id: string;
    gfycat_secret: string;
    sentry_dsn: string;
  };
  server: {
    baseUrl: string;
    port: number;
  };
  client: {
    baseUrl: string;
  };
  firebase: {
    clientEmail: string;
    projectId: string;
    privateKey: string;
  };
};

export const makeConfig = (): CSGNConfig => {
  Joi.attempt(process.env, envVarSchema);

  const isProduction = process.env.NODE_ENV === "production";

  return {
    isProduction,
    secrets: {
      steam_api_key: process.env.STEAM_API_KEY || "",
      server_key: process.env.SERVER_SECRET || "",
      gfycat_id: process.env.GFYCAT_ID || "",
      gfycat_secret: process.env.GFYCAT_SECRET || "",
      sentry_dsn: process.env.SENTRY_DSN || ""
    },
    server: {
      port: Number(process.env.PORT),
      baseUrl: isProduction
        ? "https://api.csgonades.com"
        : "http://localhost:5000"
    },
    client: {
      baseUrl: isProduction
        ? "https://www.csgonades.com"
        : "http://localhost:3000"
    },
    firebase: {
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
      projectId: process.env.FIREBASE_CLIENT_ID || "",
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : ""
    }
  };
};
