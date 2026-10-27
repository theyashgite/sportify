import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true, index: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: "" },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    photo: { type: String, default: "" },
    sport: { type: String, required: true, trim: true, maxlength: 50 },
    position: { type: String, trim: true, maxlength: 50, default: "" },
    age: { type: Number, min: 5, max: 100, required: true },
    status: { type: String, enum: ["Active", "Injured", "On leave"], default: "Active" },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      select: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Player", playerSchema);
