// /commands/moderation/p.js (ESM)
import fs from "fs";
import path from "path";
import { EmbedBuilder } from "discord.js";

const logsFile = path.resolve("./registros.json");

function loadLogs() {
  if (!fs.existsSync(logsFile)) return { bans: {}, warns: {} };
  return JSON.parse(fs.readFileSync(logsFile, "utf8"));
}
function hasStaffRole(member) {
  return member.roles.cache.some(r => ["admin", "mod"].includes(r.name.toLowerCase()));
}

export default {
  name: "p",
  description: "Ver historial/información por ID",
  async execute(message, args) {
    if (!hasStaffRole(message.member)) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    const userId = args[0];
    if (!userId) return message.reply("⚠️ Debes proporcionar la **ID** del usuario.");

    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member) return message.reply("❌ No se encontró ningún usuario con esa ID en este servidor.");

    const logs = loadLogs();
    const warns = logs.warns[userId] || [];
    const bans = logs.bans[userId] || [];

    const roles = member.roles.cache
      .filter(r => r.name !== "@everyone")
      .map(r => r.name)
      .join(", ") || "Ninguno";

    const embed = new EmbedBuilder()
      .setColor(0xdc2626) // rojo
      .setTitle(`📋 Informe de ${member.user.tag}`)
      .setThumbnail(member.user.displayAvatarURL({ forceStatic: false }))
      .addFields(
        { name: "🆔 ID", value: userId, inline: true },
        { name: "⏰ Cuenta creada", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "📅 Se unió", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: "🎭 Roles", value: roles, inline: false },
        {
          name: "⚠️ Warns",
          value: warns.length
            ? warns.map((w, i) => `\`${i + 1}.\` ${w.reason} (por <@${w.moderator}>) — <t:${Math.floor(new Date(w.date).getTime() / 1000)}:R>`).join("\n").slice(0, 1024)
            : "✅ Sin advertencias",
          inline: false
        },
        {
          name: "⛔ Bans (registro)",
          value: bans.length
            ? bans.map((b, i) => `\`${i + 1}.\` ${b.reason} (por <@${b.moderator}>) — <t:${Math.floor(new Date(b.date).getTime() / 1000)}:R>`).join("\n").slice(0, 1024)
            : "—",
          inline: false
        }
      )
      .setFooter({ text: "Moderación - Consulta de usuario" })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};
