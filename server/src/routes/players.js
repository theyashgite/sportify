import { Router } from "express";
import mongoose from "mongoose";
import Player from "../models/Player.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import { getPlayerPerformance } from "../utils/performance.js";
import { deleteAthletePhoto, isAthletePhotoPath } from "../utils/athletePhotos.js";

const router = Router();

async function validateTeam(teamId, sport, clubId) {
  if (!teamId) return true;
  if (!mongoose.isValidObjectId(teamId) || typeof sport !== "string") return false;
  const team = await Team.findOne({ _id: teamId, club: clubId }).select("sport");
  return Boolean(team && team.sport.trim().toLowerCase() === sport.trim().toLowerCase());
}

router.get("/", async (req, res) => {
  const players = await Player.find({ club: req.user.clubId }).select("+user").populate("team", "name color").sort({ createdAt: -1 });
  const performance = await getPlayerPerformance(players.map((player) => player._id));
  res.json(players.map((player) => ({
    ...player.toObject(),
    user: undefined,
    hasAccount: Boolean(player.user),
    performance: performance.get(String(player._id))
  })));
});

router.post("/", async (req, res) => {
  if (!(await validateTeam(req.body.team, req.body.sport, req.user.clubId))) {
    return res.status(400).json({ message: "Choose a team for the athlete's sport or leave them unassigned." });
  }
  const { name, email, phone, sport, position, age, status, team, photo = "" } = req.body;
  if (photo && !isAthletePhotoPath(photo)) {
    return res.status(400).json({ message: "Upload an athlete photo using the profile photo picker." });
  }
  const player = await Player.create({ name, email, phone, sport, position, age, status, team, photo, club: req.user.clubId });
  await player.populate("team", "name color");
  res.status(201).json({ ...player.toObject(), hasAccount: false });
});

router.patch("/:id", async (req, res) => {
  const playerBeforeUpdate = await Player.findOne({ _id: req.params.id, club: req.user.clubId }).select("+user");
  if (!playerBeforeUpdate) return res.status(404).json({ message: "Athlete not found." });
  const nextSport = req.body.sport ?? playerBeforeUpdate.sport;
  if (typeof nextSport !== "string" || !nextSport.trim()) {
    return res.status(400).json({ message: "Enter a valid sport for this athlete." });
  }
  const nextTeam = Object.hasOwn(req.body, "team") ? req.body.team : playerBeforeUpdate.team;
  if (!(await validateTeam(nextTeam, nextSport, req.user.clubId))) {
    return res.status(400).json({ message: "Choose a team for the athlete's sport or leave them unassigned." });
  }
  if (playerBeforeUpdate.user && Object.hasOwn(req.body, "email") &&
      req.body.email?.trim().toLowerCase() !== playerBeforeUpdate.email) {
    return res.status(409).json({ message: "This athlete has an account. Contact support before changing their login email." });
  }
  if (Object.hasOwn(req.body, "photo") && req.body.photo && !isAthletePhotoPath(req.body.photo)) {
    return res.status(400).json({ message: "Upload an athlete photo using the profile photo picker." });
  }
  if (Object.hasOwn(req.body, "sport") && nextSport.trim().toLowerCase() !== playerBeforeUpdate.sport.trim().toLowerCase()) {
    const newSportPattern = `^${nextSport.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;
    const incompatibleEvent = await Event.exists({
      club: req.user.clubId,
      participants: playerBeforeUpdate._id,
      sport: { $not: { $regex: newSportPattern, $options: "i" } }
    });
    if (incompatibleEvent) {
      return res.status(409).json({
        message: "Remove this athlete from events for their current sport before changing their sport."
      });
    }
  }
  const { name, email, phone, sport, position, age, status, team, photo } = req.body;
  const previousPhoto = playerBeforeUpdate.photo;
  const player = await Player.findOneAndUpdate({ _id: req.params.id, club: req.user.clubId }, {
    name, email, phone, sport, position, age, status, team,
    ...(photo !== undefined ? { photo } : {})
  }, {
    new: true,
    runValidators: true
  }).populate("team", "name color");
  if (!player) return res.status(404).json({ message: "Athlete not found." });
  if (previousPhoto && previousPhoto !== player.photo) await deleteAthletePhoto(previousPhoto);
  res.json({ ...player.toObject(), hasAccount: Boolean(playerBeforeUpdate.user) });
});

router.delete("/:id", async (req, res) => {
  const player = await Player.findOne({ _id: req.params.id, club: req.user.clubId }).select("+user");
  if (!player) return res.status(404).json({ message: "Athlete not found." });
  await player.deleteOne();
  if (player.user) await User.findOneAndDelete({ _id: player.user, club: req.user.clubId });
  if (player.photo) await deleteAthletePhoto(player.photo);
  await Event.updateMany(
    { club: req.user.clubId, participants: player._id },
    { $pull: { participants: player._id, performance: { player: player._id } } }
  );
  res.json({ message: "Athlete deleted." });
});

export default router;
