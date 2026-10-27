import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import User from "./models/User.js";
import Club from "./models/Club.js";
import Team from "./models/Team.js";
import Player from "./models/Player.js";
import Event from "./models/Event.js";
import { createClub, migrateLegacyClubData } from "./utils/clubs.js";

const adminName = process.env.ADMIN_NAME;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminName || !adminEmail || !adminPassword || adminPassword.length < 8) {
  throw new Error("Set ADMIN_NAME, ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in server/.env.");
}

try {
  await connectDatabase();
  await migrateLegacyClubData();

  let admin = await User.findOne({ email: adminEmail.toLowerCase() });
  let club = admin?.club ? await Club.findById(admin.club) : null;
  if (!club) club = await createClub("Sportify Club");
  if (!admin) {
    admin = await User.create({ name: adminName, email: adminEmail, password: adminPassword, role: "admin", club: club._id });
    console.log(`Created admin account: ${admin.email}`);
  } else {
    admin.club = club._id;
    await admin.save();
    console.log(`Admin account already exists: ${admin.email}`);
  }
  if (!club.owner) {
    club.owner = admin._id;
    await club.save();
  }

  if (await Team.countDocuments({ club: club._id }) === 0) {
    const teams = await Team.insertMany([
      { name: "Velocity FC", sport: "Football", coach: "Aarav Mehta", color: "#c3f53c", club: club._id },
      { name: "Court Vision", sport: "Basketball", coach: "Maya Shah", color: "#a78bfa", club: club._id },
      { name: "Aqua Squad", sport: "Swimming", coach: "Rohan Kulkarni", color: "#60a5fa", club: club._id }
    ]);
    await Player.insertMany([
      { name: "Ananya Rao", email: "ananya@example.com", sport: "Football", position: "Forward", age: 20, team: teams[0]._id, club: club._id },
      { name: "Kabir Desai", email: "kabir@example.com", sport: "Basketball", position: "Point guard", age: 21, team: teams[1]._id, club: club._id },
      { name: "Isha Nair", email: "isha@example.com", sport: "Swimming", position: "Freestyle", age: 19, team: teams[2]._id, club: club._id },
      { name: "Dev Malhotra", email: "dev@example.com", sport: "Football", position: "Midfielder", age: 22, team: teams[0]._id, status: "Injured", club: club._id }
    ]);
    console.log("Added sample teams and athletes.");
  }

  if (await Event.countDocuments({ club: club._id }) === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 5);
    const footballPlayers = await Player.find({ sport: "Football", club: club._id }).select("_id").limit(3);
    const basketballPlayers = await Player.find({ sport: "Basketball", club: club._id }).select("_id").limit(3);
    await Event.insertMany([
      { title: "Morning field session", sport: "Football", type: "Training", venue: "Main field", date: tomorrow, participants: footballPlayers.map((player) => player._id), club: club._id },
      { title: "Inter-college friendly", sport: "Basketball", type: "Match", venue: "Sports arena", date: nextWeek, participants: basketballPlayers.map((player) => player._id), club: club._id }
    ]);
    console.log("Added sample events.");
  }
} finally {
  await mongoose.disconnect();
}
