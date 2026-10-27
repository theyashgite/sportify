import { Router } from "express";
import Player from "../models/Player.js";
import Team from "../models/Team.js";
import Event from "../models/Event.js";

const router = Router();

router.get("/", async (req, res) => {
  const now = new Date();
  const club = req.user.clubId;
  const [athletes, teams, upcomingEvents, activePlayers, injuredPlayers] = await Promise.all([
    Player.countDocuments({ club }),
    Team.countDocuments({ club }),
    Event.find({ club, date: { $gte: now }, status: "Scheduled" }).sort({ date: 1 }).limit(5),
    Player.countDocuments({ club, status: "Active" }),
    Player.countDocuments({ club, status: "Injured" })
  ]);

  res.json({
    stats: { athletes, teams, upcomingEvents: await Event.countDocuments({ club, date: { $gte: now }, status: "Scheduled" }), activePlayers, injuredPlayers },
    upcomingEvents
  });
});

export default router;
