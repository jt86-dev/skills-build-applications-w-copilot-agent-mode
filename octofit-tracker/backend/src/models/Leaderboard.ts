import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, min: 0, required: true, default: 0 },
    period: { type: String, required: true, default: 'all-time' },
  },
  { timestamps: true },
);

leaderboardSchema.index({ user: 1, period: 1 }, { unique: true });

export const Leaderboard = mongoose.models.Leaderboard || mongoose.model('Leaderboard', leaderboardSchema);