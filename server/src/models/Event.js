import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  attendance: { type: String, enum: ["Not recorded", "Present", "Absent"], default: "Not recorded" },
  score: { type: Number, min: 0, max: 10000, default: 0 }
}, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true, index: true },
    sport: { type: String, required: true, trim: true, maxlength: 50 },
    type: { type: String, enum: ["Training", "Match", "Tournament"], default: "Training" },
    venue: { type: String, required: true, trim: true, maxlength: 120 },
    date: { type: Date, required: true },
    status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" },
    result: { type: String, enum: ["Not recorded", "Win", "Loss", "Draw"], default: "Not recorded" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
    performance: { type: [performanceSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
