import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { migrateLegacyClubData } from "./utils/clubs.js";

const port = Number(process.env.PORT) || 5000;
const retryDelay = 10_000;

function isTransientDatabaseError(error) {
  return error.name === "MongooseServerSelectionError" ||
    ["ECONNREFUSED", "EAI_AGAIN", "ETIMEDOUT"].includes(error.code) ||
    error.syscall === "querySrv";
}

try {
  while (true) {
    try {
      await connectDatabase();
      break;
    } catch (error) {
      if (!isTransientDatabaseError(error)) throw error;
      console.error(`MongoDB is unreachable; retrying in ${retryDelay / 1000} seconds: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  await migrateLegacyClubData();
  app.listen(port, () => console.log(`Sportify API listening on http://localhost:${port}`));
} catch (error) {
  console.error("Unable to start Sportify API:", error.message);
  if (error.message.includes("Could not connect to any servers in your MongoDB Atlas cluster")) {
    console.error("Check MONGODB_URI and add this server's current public IP under MongoDB Atlas → Network Access. Do not allow all IPs for convenience.");
  }
  process.exitCode = 1;
}
