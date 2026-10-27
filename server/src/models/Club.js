import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    inviteCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    legacy: { type: Boolean, default: false }
  },
  { timestamps: true }
);

clubSchema.index({ legacy: 1 }, { unique: true, partialFilterExpression: { legacy: true } });

export default mongoose.model("Club", clubSchema);
