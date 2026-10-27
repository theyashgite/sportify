import { Router } from "express";
import mongoose from "mongoose";
import Club from "../models/Club.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import Event from "../models/Event.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/me", async (req, res) => {
  const club = await Club.findById(req.user.clubId).lean();
  if (!club) return res.status(404).json({ message: "Your club could not be found." });
  const coaches = await User.find({ club: club._id, role: { $in: ["coach", "admin"] } })
    .select("name email role")
    .sort({ name: 1 })
    .lean();
  res.json({
    club: { id: String(club._id), name: club.name, inviteCode: club.inviteCode },
    coaches
  });
});

router.get("/coaches", requireRole("admin"), async (req, res) => {
  const coaches = await User.find({ club: req.user.clubId, role: "coach" })
    .select("name email createdAt")
    .sort({ name: 1 })
    .lean();
  const teams = await Team.find({ club: req.user.clubId })
    .select("name sport coachEmail")
    .sort({ name: 1 })
    .lean();
  const coachEmails = new Set(coaches.map((coach) => coach.email));
  const teamIds = teams.map((team) => team._id);
  const athleteCounts = teamIds.length
    ? await Player.aggregate([
      { $match: { team: { $in: teamIds } } },
      { $group: { _id: "$team", count: { $sum: 1 } } }
    ])
    : [];
  const countsByTeam = new Map(athleteCounts.map(({ _id, count }) => [String(_id), count]));
  const teamsByEmail = new Map(coaches.map((coach) => [coach.email, []]));
  const unassignedTeams = [];
  for (const team of teams) {
    const assignedTeams = teamsByEmail.get(team.coachEmail);
    if (assignedTeams) {
      assignedTeams.push({
        id: String(team._id),
        name: team.name,
        sport: team.sport,
        athletes: countsByTeam.get(String(team._id)) || 0
      });
    } else {
      unassignedTeams.push({
        id: String(team._id),
        name: team.name,
        sport: team.sport,
        coachEmail: team.coachEmail,
        athletes: countsByTeam.get(String(team._id)) || 0,
        hasUnregisteredCoach: Boolean(team.coachEmail && !coachEmails.has(team.coachEmail))
      });
    }
  }
  res.json({
    coaches: coaches.map((coach) => {
      const assignedTeams = teamsByEmail.get(coach.email) || [];
      return {
        id: String(coach._id),
        name: coach.name,
        email: coach.email,
        joinedAt: coach.createdAt,
        teams: assignedTeams,
        athleteCount: assignedTeams.reduce((total, team) => total + team.athletes, 0)
      };
    }),
    unassignedTeams
  });
});

router.get("/coaches/:coachId", requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.coachId)) {
    return res.status(400).json({ message: "The requested coach ID is invalid." });
  }
  const coach = await User.findOne({
    _id: req.params.coachId,
    club: req.user.clubId,
    role: "coach"
  }).select("name email photo createdAt").lean();
  if (!coach) return res.status(404).json({ message: "This coach is not registered in your club." });

  const teams = await Team.find({ club: req.user.clubId, coachEmail: coach.email })
    .select("name sport coachEmail")
    .sort({ name: 1 })
    .lean();
  const teamIds = teams.map((team) => team._id);
  const athletes = teamIds.length
    ? await Player.find({ club: req.user.clubId, team: { $in: teamIds } })
      .select("name email sport position age status team")
      .sort({ name: 1 })
      .lean()
    : [];
  const athleteIds = athletes.map((athlete) => athlete._id);
  const eventFilter = athleteIds.length
    ? { club: req.user.clubId, participants: { $in: athleteIds } }
    : null;
  const now = new Date();
  const [upcomingEvents, recentEvents, completedEvents, eventCount] = eventFilter
    ? await Promise.all([
      Event.find({ ...eventFilter, status: "Scheduled", date: { $gte: now } })
        .select("title sport type venue date status")
        .sort({ date: 1 })
        .limit(5)
        .lean(),
      Event.find({ ...eventFilter, status: "Completed" })
        .select("title sport type venue date status")
        .sort({ date: -1 })
        .limit(5)
        .lean(),
      Event.countDocuments({ ...eventFilter, status: "Completed" }),
      Event.countDocuments(eventFilter)
    ])
    : [[], [], 0, 0];
  const athletesByTeam = new Map(teamIds.map((teamId) => [String(teamId), []]));
  for (const athlete of athletes) {
    athletesByTeam.get(String(athlete.team))?.push({
      id: String(athlete._id),
      name: athlete.name,
      email: athlete.email,
      sport: athlete.sport,
      position: athlete.position,
      age: athlete.age,
      status: athlete.status
    });
  }

  res.json({
    coach: {
      id: String(coach._id),
      name: coach.name,
      email: coach.email,
      photo: coach.photo || "",
      joinedAt: coach.createdAt
    },
    teams: teams.map((team) => ({
      id: String(team._id),
      name: team.name,
      sport: team.sport,
      athletes: athletesByTeam.get(String(team._id)) || []
    })),
    summary: {
      teamCount: teams.length,
      athleteCount: athletes.length,
      eventCount,
      completedEventCount: completedEvents
    },
    upcomingEvents,
    recentEvents
  });
});

router.post("/coaches", requireRole("admin"), async (req, res) => {
  const { name, email, password } = req.body;
  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof password !== "string" || !password
  ) {
    return res.status(400).json({ message: "Coach name, email and initial password are required." });
  }
  if (name.trim().length > 80) {
    return res.status(400).json({ message: "Coach name must be 80 characters or fewer." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: "Enter a valid email address for the coach." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Initial password must be at least 8 characters." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }
  const coach = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: "coach",
    club: req.user.clubId
  });
  res.status(201).json({
    coach: {
      id: String(coach._id),
      name: coach.name,
      email: coach.email,
      joinedAt: coach.createdAt,
      teams: [],
      athleteCount: 0
    }
  });
});

export default router;
