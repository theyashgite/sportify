import { randomBytes } from "node:crypto";
import Club from "../models/Club.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import Event from "../models/Event.js";

export function createInviteCode() {
  return randomBytes(8).toString("hex").toUpperCase();
}

export async function createClub(name, owner = null, legacy = false) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Club.create({ name, owner, legacy, inviteCode: createInviteCode() });
    } catch (error) {
      if (error.code !== 11000 || error.keyPattern?.legacy || attempt === 4) throw error;
    }
  }
  throw new Error("Unable to create a unique club invite code.");
}

export async function migrateLegacyClubData() {
  const [users, teams, players, events] = await Promise.all([
    User.countDocuments({ club: { $exists: false } }),
    Team.countDocuments({ club: { $exists: false } }),
    Player.countDocuments({ club: { $exists: false } }),
    Event.countDocuments({ club: { $exists: false } })
  ]);
  if (!users && !teams && !players && !events) return null;

  let club = await Club.findOne({ legacy: true });
  if (!club) {
    const legacyOwner = await User.findOne({
      role: { $in: ["admin", "coach"] },
      club: { $exists: false }
    }).sort({ createdAt: 1 });
    try {
      club = await createClub("Existing Sportify Club", legacyOwner?._id || null, true);
    } catch (error) {
      if (error.code !== 11000) throw error;
      club = await Club.findOne({ legacy: true });
      if (!club) throw error;
    }
  }

  await Promise.all([
    User.updateMany({ club: { $exists: false } }, { $set: { club: club._id } }),
    Team.updateMany({ club: { $exists: false } }, { $set: { club: club._id } }),
    Player.updateMany({ club: { $exists: false } }, { $set: { club: club._id } }),
    Event.updateMany({ club: { $exists: false } }, { $set: { club: club._id } })
  ]);
  return club;
}
