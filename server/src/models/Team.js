import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true, index: true },
    sport: { type: String, required: true, trim: true, maxlength: 50 },
    coach: { type: String, trim: true, maxlength: 80, default: "" },
    coachEmail: { type: String, trim: true, lowercase: true, maxlength: 120, default: "" },
    coachPhone: { type: String, trim: true, maxlength: 30, default: "" },
    color: { type: String, match: /^#[0-9a-fA-F]{6}$/, default: "#c3f53c" }
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
