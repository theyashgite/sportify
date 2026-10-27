import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Club from "../models/Club.js";
import Player from "../models/Player.js";
import Event from "../models/Event.js";
import { requireAuth } from "../middleware/auth.js";
import { getPlayerPerformance } from "../utils/performance.js";
import { deleteAthletePhoto, isAthletePhotoPath } from "../utils/athletePhotos.js";
import { createClub } from "../utils/clubs.js";

const router = Router();

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required. Configure server/.env before starting the API.");
  }
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, photo: user.photo || "" };
}

router.post("/register", async (req, res) => {
  const { name, email, password, clubName, inviteCode } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const normalizedCode = typeof inviteCode === "string" ? inviteCode.trim().toUpperCase() : "";
  const normalizedClubName = typeof clubName === "string" ? clubName.trim() : "";
  if (Boolean(normalizedCode) === Boolean(normalizedClubName)) {
    return res.status(400).json({ message: "Enter a club name to create a club, or an invite code to join one." });
  }
  let club;
  if (normalizedCode) {
    club = await Club.findOne({ inviteCode: normalizedCode });
    if (!club) return res.status(400).json({ message: "That club invite code is not valid." });
  } else {
    if (normalizedClubName.length > 80) {
      return res.status(400).json({ message: "Club name must be 80 characters or fewer." });
    }
    club = await createClub(normalizedClubName);
  }

  let user;
  try {
    user = await User.create({ name, email, password, role: "coach", club: club._id });
    if (!club.owner) {
      club.owner = user._id;
      await club.save();
    }
  } catch (error) {
    if (user) await User.deleteOne({ _id: user._id });
    if (normalizedClubName) await Club.deleteOne({ _id: club._id });
    throw error;
  }
  res.status(201).json({ token: createToken(user), user: publicUser(user) });
});

router.post("/athlete/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const matchingPlayers = await Player.find({ email: normalizedEmail, user: { $exists: false } }).limit(2);
  if (matchingPlayers.length !== 1) {
    return res.status(403).json({
      message: matchingPlayers.length
        ? "More than one athlete profile uses this email. Ask your coach to confirm your account."
        : "No unclaimed athlete profile matches this email. Ask your coach to add you first."
    });
  }
  const player = matchingPlayers[0];

  const user = await User.create({
    name: player.name,
    email: normalizedEmail,
    password,
    role: "athlete",
    club: player.club
  });

  try {
    player.user = user._id;
    await player.save();
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  res.status(201).json({ token: createToken(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  if (role && !["admin", "coach", "athlete"].includes(role)) {
    return res.status(400).json({ message: "Choose a valid account type." });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  if (!user || !user.password || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  if (role && user.role !== role) {
    return res.status(403).json({ message: `This account is not registered as a ${role === "admin" ? "administrator" : role}.` });
  }

  res.json({ token: createToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) {
    return res.status(401).json({ message: "This account is no longer available." });
  }
  res.json({ user: publicUser(user) });
});

router.patch("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) {
    return res.status(401).json({ message: "This account is no longer available." });
  }
  if (user.role === "athlete") {
    return res.status(403).json({ message: "Only coaches and administrators can update this profile." });
  }
  if (!Object.hasOwn(req.body, "photo") || (req.body.photo && !isAthletePhotoPath(req.body.photo))) {
    return res.status(400).json({ message: "Upload a profile photo using the profile photo picker." });
  }

  const previousPhoto = user.photo;
  user.photo = req.body.photo;
  await user.save();
  if (previousPhoto && previousPhoto !== user.photo) await deleteAthletePhoto(previousPhoto);
  res.json({ user: publicUser(user) });
});

router.get("/athlete/me", requireAuth, async (req, res) => {
  if (req.user.role !== "athlete") {
    return res.status(403).json({ message: "This page is only available to athlete accounts." });
  }

  const player = await Player.findOne({ user: req.user.sub, club: req.user.clubId })
    .populate("team", "name color sport coach coachEmail coachPhone");
  if (!player) {
    return res.status(404).json({ message: "Your athlete profile is unavailable. Please contact your coach." });
  }

  const [events, teamPlayers, clubAthleteCount] = await Promise.all([
    Event.find({
      club: req.user.clubId,
      participants: player._id,
      status: "Scheduled",
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(8),
    player.team
      ? Player.find({
        team: player.team._id,
        club: req.user.clubId,
        sport: { $regex: `^${player.sport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
      }).select("name email phone photo sport position").sort({ name: 1 }).lean()
      : Promise.resolve([]),
    Player.countDocuments({ club: req.user.clubId })
  ]);

  const coachProfile = player.team?.coachEmail
    ? await User.findOne({
      email: player.team.coachEmail,
      club: req.user.clubId,
      role: { $in: ["coach", "admin"] }
    }).select("name email photo").lean()
    : null;
  const performance = await getPlayerPerformance([player._id]);
  res.json({
    player,
    events,
    performance: performance.get(String(player._id)),
    teamPlayers,
    teamPlayerCount: teamPlayers.length,
    clubAthleteCount,
    coachProfile: coachProfile || (player.team && (player.team.coach || player.team.coachEmail || player.team.coachPhone) ? {
      name: player.team.coach,
      email: player.team.coachEmail || "",
      phone: player.team.coachPhone || "",
      photo: ""
    } : null)
  });
});

export default router;
