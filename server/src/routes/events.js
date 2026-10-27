import { Router } from "express";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import Player from "../models/Player.js";

const router = Router();

const participantFields = "name sport position team";

async function validateParticipants(participants, sport, clubId) {
  if (typeof sport !== "string" || !sport.trim()) {
    return "Add the event sport before selecting athletes.";
  }
  if (!Array.isArray(participants)) {
    return "Select athletes from the team roster.";
  }
  if (participants.some((id) => !mongoose.isValidObjectId(id))) {
    return "One or more selected athlete IDs are invalid.";
  }

  const uniqueIds = [...new Set(participants.map(String))];
  const players = await Player.find({ _id: { $in: uniqueIds }, club: clubId }).select("sport");
  if (players.length !== uniqueIds.length) {
    return "One or more selected athletes no longer exist.";
  }
  if (players.some((player) => player.sport.trim().toLowerCase() !== sport.trim().toLowerCase())) {
    return "Select only athletes who play this event's sport.";
  }
  return null;
}

async function populateParticipants(event) {
  return event.populate({
    path: "participants",
    select: participantFields,
    populate: { path: "team", select: "name color" }
  });
}

function normalizePerformance(entries, participantIds) {
  if (!Array.isArray(entries)) {
    return { error: "Performance records must be provided as a list." };
  }
  const participantSet = new Set(participantIds.map(String));
  const performanceByPlayer = new Map();
  for (const entry of entries || []) {
    if (!entry || typeof entry !== "object") {
      return { error: "Each performance record must include an athlete and event details." };
    }
    const playerId = String(entry.player || "");
    if (!mongoose.isValidObjectId(playerId) || !participantSet.has(playerId)) {
      return { error: "Performance can only be recorded for athletes selected for this event." };
    }
    if (performanceByPlayer.has(playerId)) {
      return { error: "Performance can only be recorded once per athlete." };
    }
    if (!["Not recorded", "Present", "Absent"].includes(entry.attendance)) {
      return { error: "Choose a valid attendance status for each athlete." };
    }
    if (!Number.isInteger(entry.score) || entry.score < 0 || entry.score > 10000) {
      return { error: "Goals or points must be a whole number between 0 and 10000." };
    }
    performanceByPlayer.set(playerId, {
      player: playerId,
      attendance: entry.attendance,
      score: entry.score
    });
  }

  return {
    performance: participantIds.map((id) => performanceByPlayer.get(String(id)) || ({
      player: String(id),
      attendance: "Not recorded",
      score: 0
    }))
  };
}

router.get("/", async (req, res) => {
  const events = await Event.find({ club: req.user.clubId }).populate({
    path: "participants",
    select: participantFields,
    populate: { path: "team", select: "name color" }
  }).sort({ date: 1 });
  res.json(events);
});

router.post("/", async (req, res) => {
  const { title, sport, type, venue, date, status, result, participants = [], performance = [] } = req.body;
  const participantsError = await validateParticipants(participants, sport || "", req.user.clubId);
  if (participantsError) {
    return res.status(400).json({ message: participantsError });
  }
  const uniqueParticipants = [...new Set(participants.map(String))];
  const normalizedPerformance = normalizePerformance(performance, uniqueParticipants);
  if (normalizedPerformance.error) {
    return res.status(400).json({ message: normalizedPerformance.error });
  }
  if (result && result !== "Not recorded" && type !== "Match" && type !== "Tournament") {
    return res.status(400).json({ message: "Only matches and tournaments can have a win, loss or draw result." });
  }
  const event = await Event.create({
    title, sport, type, venue, date, status, result,
    participants: uniqueParticipants,
    performance: normalizedPerformance.performance,
    club: req.user.clubId
  });
  await populateParticipants(event);
  res.status(201).json(event);
});

router.patch("/:id", async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, club: req.user.clubId });
  if (!event) return res.status(404).json({ message: "Event not found." });
  const { title, sport, type, venue, date, status, result, participants, performance } = req.body;
  const nextSport = sport ?? event.sport;
  const nextParticipants = participants ?? (event.participants || []).map(String);
  const participantsError = await validateParticipants(nextParticipants, nextSport, req.user.clubId);
  if (participantsError) {
    return res.status(400).json({ message: participantsError });
  }
  const normalizedPerformance = normalizePerformance(
    performance ?? event.performance ?? [],
    [...new Set(nextParticipants.map(String))]
  );
  if (normalizedPerformance.error) {
    return res.status(400).json({ message: normalizedPerformance.error });
  }
  const nextType = type ?? event.type;
  const nextResult = result ?? event.result ?? "Not recorded";
  if (nextResult !== "Not recorded" && nextType !== "Match" && nextType !== "Tournament") {
    return res.status(400).json({ message: "Only matches and tournaments can have a win, loss or draw result." });
  }

  for (const [field, value] of Object.entries({ title, sport, type, venue, date, status, result })) {
    if (value !== undefined) event[field] = value;
  }
  event.participants = [...new Set(nextParticipants.map(String))];
  event.performance = normalizedPerformance.performance;
  await event.save();
  await populateParticipants(event);
  res.json(event);
});

router.delete("/:id", async (req, res) => {
  const event = await Event.findOneAndDelete({ _id: req.params.id, club: req.user.clubId });
  if (!event) return res.status(404).json({ message: "Event not found." });
  res.json({ message: "Event deleted." });
});

export default router;
