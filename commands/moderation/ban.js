// /commands/moderation/ban.js (ESM)
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
  name: "ban",
  description: "Banear por ID",
  async execute(message, args) {
    if (!hasStaffRole(message.member)) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    const userId = args[0];
    const reason = args.slice(1).join(" ") || "No especificado";
    if (!userId) return message.reply("⚠️ Debes proporcionar la **ID** del usuario.");

    try {
      // Si está en el servidor, ban directo al miembro; si no, ban por ID
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (member) {
        await member.ban({ reason });
      } else {
        await message.guild.bans.create(userId, { reason });
      }

      // Registrar
      const db = loadLogs();
      if (!db.bans[userId]) db.bans[userId] = [];
      db.bans[userId].push({
        moderator: message.author.id,
        reason,
        date: new Date().toISOString(),
      });
      saveLogs(db);

      return message.channel.send(`✅ Usuario \`${userId}\` baneado. Razón: ${reason}`);
    } catch (err) {
      console.error(err);
      return message.reply("❌ No pude banear al usuario. Revisa permisos/ID.");
    }
  },
};
