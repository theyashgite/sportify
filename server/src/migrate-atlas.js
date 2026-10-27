import "dotenv/config";
import mongoose from "mongoose";

const sourceUri = process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/sportify";
const atlasUri = process.env.ATLAS_MONGODB_URI;
const databaseName = "sportify";
const collectionNames = ["users", "clubs", "teams", "players", "events"];
const dryRun = !process.argv.includes("--apply");

function getHostname(uri) {
  try {
    return new URL(uri).hostname.toLowerCase();
  } catch {
    throw new Error("A MongoDB connection URI is invalid. Check the local and Atlas URIs in server/.env.");
  }
}

if (!atlasUri) {
  throw new Error("ATLAS_MONGODB_URI is missing. Add the private Atlas connection string to server/.env.");
}
if (getHostname(sourceUri) === getHostname(atlasUri)) {
  throw new Error("The source and Atlas destination appear to use the same host. Migration cancelled.");
}

const source = mongoose.createConnection(sourceUri, { dbName: databaseName });
const destination = mongoose.createConnection(atlasUri, { dbName: databaseName });
const createdCollections = [];

try {
  await Promise.all([source.asPromise(), destination.asPromise()]);

  const sourceCollectionNames = new Set(
    (await source.db.listCollections({}, { nameOnly: true }).toArray()).map((collection) => collection.name)
  );
  const existingTargetCollections = new Set(
    (await destination.db.listCollections({}, { nameOnly: true }).toArray()).map((collection) => collection.name)
  );
  const collectionsToCopy = collectionNames.filter((name) => sourceCollectionNames.has(name));

  const requiredCollectionNames = ["users", "teams", "players", "events"];
  if (requiredCollectionNames.some((name) => !sourceCollectionNames.has(name))) {
    const missingCollections = requiredCollectionNames.filter((name) => !sourceCollectionNames.has(name));
    throw new Error(`Local database is missing required collections: ${missingCollections.join(", ")}.`);
  }

  const sourceCounts = new Map();
  for (const name of collectionsToCopy) {
    const count = await source.db.collection(name).countDocuments();
    sourceCounts.set(name, count);
    if (existingTargetCollections.has(name)) {
      throw new Error(`Atlas already has a "${name}" collection. Migration only runs into a fresh database to prevent overwriting data.`);
    }
  }

  console.log(`Migration mode: ${dryRun ? "DRY RUN (no Atlas data will be written)" : "APPLY"}`);
  console.log(`MongoDB database: ${databaseName}`);
  console.log(`Source: local MongoDB at ${getHostname(sourceUri)}`);
  console.log(`Destination: Atlas at ${getHostname(atlasUri)}`);
  for (const name of collectionsToCopy) {
    console.log(`  ${name}: ${sourceCounts.get(name)} documents`);
  }

  if (dryRun) {
    console.log("Preflight passed. Review the collection counts, then run npm run migrate:atlas -- --apply.");
  } else {
    for (const name of collectionsToCopy) {
      const collection = destination.db.collection(name);
      await destination.db.createCollection(name);
      createdCollections.push(name);

      const cursor = source.db.collection(name).find().batchSize(500);
      let batch = [];
      for await (const document of cursor) {
        batch.push({ insertOne: { document } });
        if (batch.length === 500) {
          await collection.bulkWrite(batch, { ordered: true });
          batch = [];
        }
      }
      if (batch.length) {
        await collection.bulkWrite(batch, { ordered: true });
      }

      const indexes = await source.db.collection(name).indexes();
      for (const { key, ...indexOptions } of indexes) {
        if (indexOptions.name === "_id_") continue;
        delete indexOptions.v;
        delete indexOptions.ns;
        await collection.createIndex(key, indexOptions);
      }

      const destinationCount = await collection.countDocuments();
      if (destinationCount !== sourceCounts.get(name)) {
        throw new Error(`Verification failed for "${name}": the source and Atlas document counts differ.`);
      }
      console.log(`  Copied and verified ${name}: ${destinationCount} documents`);
    }

    console.log("Migration completed. Local MongoDB data was not modified.");
  }
} catch (error) {
  if (!dryRun) {
    for (const name of createdCollections) {
      try {
        await destination.db.dropCollection(name);
      } catch {
        console.error(`Could not remove partially migrated Atlas collection "${name}". Check it before retrying.`);
      }
    }
  }
  console.error(`Atlas migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await Promise.all([source.close(), destination.close()]);
}
