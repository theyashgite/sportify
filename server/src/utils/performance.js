import Event from "../models/Event.js";

export function summarizePlayerPerformance(events, playerIds) {
  const statsByPlayer = new Map(playerIds.map((id) => [String(id), {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    goalsOrPoints: 0,
    attended: 0,
    attendanceRecorded: 0,
    attendanceRate: null
  }]));

  for (const event of events) {
    if (event.status !== "Completed") continue;
    const isMatch = event.type === "Match" || event.type === "Tournament";
    for (const entry of event.performance) {
      const stats = statsByPlayer.get(String(entry.player));
      if (!stats) continue;

      if (entry.attendance === "Present" || entry.attendance === "Absent") {
        stats.attendanceRecorded += 1;
        if (entry.attendance === "Present") stats.attended += 1;
      }
      if (entry.attendance !== "Present") continue;

      stats.goalsOrPoints += entry.score || 0;
      if (!isMatch) continue;
      stats.matchesPlayed += 1;
      if (event.result === "Win") stats.wins += 1;
      if (event.result === "Loss") stats.losses += 1;
      if (event.result === "Draw") stats.draws += 1;
    }
  }

  for (const stats of statsByPlayer.values()) {
    if (stats.attendanceRecorded) {
      stats.attendanceRate = Math.round((stats.attended / stats.attendanceRecorded) * 100);
    }
  }
  return statsByPlayer;
}

export async function getPlayerPerformance(playerIds) {
  if (!playerIds.length) return summarizePlayerPerformance([], playerIds);

  const events = await Event.find({
    status: "Completed",
    "performance.player": { $in: playerIds }
  }).select("type result performance status").lean();
  return summarizePlayerPerformance(events, playerIds);
}
