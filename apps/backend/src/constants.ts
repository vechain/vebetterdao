if (!process.env.MONGO_URI) {
  throw new Error("Missing MONGO_URI environment variable");
}

export const dbConstants = {
  uri: process.env.MONGO_URI,
};
