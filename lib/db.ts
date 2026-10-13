import dns from "node:dns";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "joblay";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(MONGODB_URI);
}

function isSrvLookupError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === "ECONNREFUSED" ||
    e?.code === "ESERVFAIL" ||
    Boolean(e?.message?.includes("querySrv"))
  );
}

async function connectOnce(uri: string) {
  return mongoose.connect(uri, {
    dbName: MONGODB_DB,
    bufferCommands: false,
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) return null;

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = connectOnce(MONGODB_URI).catch(async (err) => {
      if (!isSrvLookupError(err)) throw err;
      // Local DNS resolvers (VPNs, some ISPs on Windows) often refuse SRV
      // lookups for mongodb+srv:// URIs — retry against public resolvers.
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      return connectOnce(MONGODB_URI);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
