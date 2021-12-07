import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongod = new MongoMemoryServer();

export class MongoTestDatabase {
  static connect = async () => {
    const uri = await mongod.getUri();

    await mongoose.connect(uri, {
      // useNewUrlParser: true,
      // useFindAndModify: false,
      // useUnifiedTopology: true,
      // reconnectInterval: 1,
      // autoReconnect: true,
    });
  };

  static closeDatabase = async () => {
    await mongoose.connection.close();
    await mongod.stop();
  };

  static clearDatabase = async () => {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  };
}
