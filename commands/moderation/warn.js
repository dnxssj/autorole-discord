// /commands/moderation/warn.js (ESM)
import fs from "fs";
import path from "path";

const logsFile = path.resolve("./registros.json");

function loadLogs() {
  if (!fs.existsSync(logsFile)) return { bans: {}, warns: {} };
  return JSON.parse(fs.readFileSync(logsFile, "utf8"));
}
function saveLogs(db) {
  fs.writeFileSync(logsFile, JSON.stringify(db, null, 2));
}
function hasStaffRole(member) {
  return member.roles.cache.some(r => ["admin", "mod"].includes(r.name.toLowerCase()));
}

export default {
  name: "warn",
  description: "Advertir por ID",
  async execute(message, args) {
    if (!hasStaffRole(message.member)) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    const userId = args[0];
    const reason = args.slice(1).join(" ") || "No especificado";
    if (!userId) return message.reply("⚠️ Debes proporcionar la **ID** del usuario.");

    const db = loadLogs();
    if (!db.warns[userId]) db.warns[userId] = [];
    db.warns[userId].push({
      moderator: message.author.id,
      reason,
      date: new Date().toISOString(),
    });
    saveLogs(db);

    return message.channel.send(`⚠️ Warn aplicado a \`${userId}\`. Razón: ${reason}`);
  },
};
