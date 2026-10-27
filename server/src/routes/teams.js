import { Router } from "express";
import mongoose from "mongoose";
import Team from "../models/Team.js";
import Player from "../models/Player.js";

const router = Router();

router.get("/", async (req, res) => {
  const club = req.user.clubId;
  const teams = await Team.find({ club }).sort({ name: 1 }).lean();
  const counts = await Player.aggregate([
    { $match: { club: new mongoose.Types.ObjectId(club) } },
    { $group: { _id: "$team", count: { $sum: 1 } } }
  ]);
  const countByTeam = new Map(counts.map((item) => [String(item._id), item.count]));
  res.json(teams.map((team) => ({ ...team, playerCount: countByTeam.get(String(team._id)) || 0 })));
});

router.post("/", async (req, res) => {
  const team = await Team.create({ ...req.body, club: req.user.clubId });
  res.status(201).json(team);
});

router.patch("/:id", async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, club: req.user.clubId });
  if (!team) return res.status(404).json({ message: "Team not found." });
  const nextSport = req.body.sport ?? team.sport;
  if (typeof nextSport !== "string" || !nextSport.trim()) {
    return res.status(400).json({ message: "Enter a valid sport for this team." });
  }
  if (nextSport.trim().toLowerCase() !== team.sport.trim().toLowerCase()) {
    const players = await Player.find({ team: team._id, club: req.user.clubId }).select("sport");
    if (players.some((player) => player.sport.trim().toLowerCase() !== nextSport.trim().toLowerCase())) {
      return res.status(409).json({
        message: "Move this team's athletes to matching teams before changing its sport."
      });
    }
  }
  for (const [field, value] of Object.entries({
    name: req.body.name,
    sport: req.body.sport,
    coach: req.body.coach,
    coachEmail: req.body.coachEmail,
    coachPhone: req.body.coachPhone,
    color: req.body.color
  })) {
    if (value !== undefined) team[field] = value;
  }
  await team.save();
  res.json(team);
});

router.delete("/:id", async (req, res) => {
  const playerCount = await Player.countDocuments({ team: req.params.id, club: req.user.clubId });
  if (playerCount > 0) {
    return res.status(409).json({ message: "Move or remove this team's athletes before deleting it." });
  }
  const team = await Team.findOneAndDelete({ _id: req.params.id, club: req.user.clubId });
  if (!team) return res.status(404).json({ message: "Team not found." });
  res.json({ message: "Team deleted." });
});

export default router;
