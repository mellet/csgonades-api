import joi, { BooleanSchema } from "joi";
import dotenv from "dotenv";

dotenv.config();

const envVarSchema = joi
  .object({
    PORT: joi.number().required(),
    STEAM_API_KEY: joi.string().required(),
    SERVER_SECRET: joi.string().required(),
    FIREBASE_CLIENT_EMAIL: joi.string().required(),
    FIREBASE_CLIENT_ID: joi.string().required(),
    FIREBASE_PRIVATE_KEY: joi.string().required(),
    GFYCAT_ID: joi.string().required(),
    GFYCAT_SECRET: joi.string().required()
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
  const { error } = joi.validate(process.env, envVarSchema);
  if (error) {
    throw new Error(`Environment not configured correctly: ${error.message}`);
  }

  const isProduction = process.env.NODE_ENV === "production";

  return {
    isProduction,
    secrets: {
      steam_api_key: process.env.STEAM_API_KEY,
      server_key: process.env.SERVER_SECRET,
      gfycat_id: process.env.GFYCAT_ID,
      gfycat_secret: process.env.GFYCAT_SECRET
    },
    server: {
      port: Number(process.env.PORT),
      baseUrl: isProduction
        ? "https://api.csgonades.com"
        : "http://localhost:5000"
    },
    client: {
      baseUrl: isProduction
        ? "http://beta.csgonades.com"
        : "http://localhost:3000"
    },
    firebase: {
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      projectId: process.env.FIREBASE_CLIENT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }
  };
};
