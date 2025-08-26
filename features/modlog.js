// features/modlog.js
import fs from "fs";
import { EmbedBuilder } from "discord.js";

const registrosPath = "./registros.json";

function loadRegistros() {
  if (!fs.existsSync(registrosPath)) return {};
  return JSON.parse(fs.readFileSync(registrosPath, "utf8"));
}
function saveRegistros(data) {
  fs.writeFileSync(registrosPath, JSON.stringify(data, null, 2));
}

/**
 * Registra acciones de moderación.
 * Ahora persistimos: ban, warn, kick, mute, unmute
 */
export async function logModAction(client, config, data) {
  try {
    // Acciones que guardamos en archivo
    const persistTypes = ["ban", "warn", "kick", "mute", "unmute"];

    if (persistTypes.includes(data.type)) {
      const store = loadRegistros();
      if (!store[data.userId]) store[data.userId] = [];
      store[data.userId].push({
        type: data.type,
        reason: data.reason || "No especificada",
        moderator: data.moderatorId,
        date: new Date().toISOString(),
      });
      saveRegistros(store);
    }

    // Embed al canal de logs
    if (!config.modLogChannelId) return;
    const ch = await client.channels.fetch(config.modLogChannelId).catch(() => null);
    if (!ch) return;

    const colors = {
      ban: 0xff3b30,
      warn: 0xffcc00,
      kick: 0xff9500,
      mute: 0x3498db,
      unmute: 0x2ecc71,
    };

    const embed = new EmbedBuilder()
      .setTitle("🛡️ Log de Moderación")
      .setColor(colors[data.type] || 0x5865f2)
      .addFields(
        { name: "Acción", value: `\`${data.type.toUpperCase()}\`` , inline: true },
        { name: "Usuario", value: `<@${data.userId}> (${data.userId})`, inline: true },
        { name: "Moderador", value: `<@${data.moderatorId}>`, inline: true },
        { name: "Razón", value: data.reason || "No especificada", inline: false },
      )
      .setTimestamp();

    await ch.send({ embeds: [embed] });
  } catch (e) {
    console.error("logModAction error:", e);
  }
}
