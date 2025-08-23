import fs from "fs";
import path from "path";
import { EmbedBuilder, PermissionsBitField } from "discord.js";

const warnsFile = path.resolve("./registros.json");

function loadWarns() {
  if (!fs.existsSync(warnsFile)) return {};
  return JSON.parse(fs.readFileSync(warnsFile, "utf8"));
}

function saveWarns(data) {
  fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
}

export default {
  name: "warn",
  description: "Añade un warn a un usuario por ID",
  async execute(message, args) {
    // Permiso solo admin
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    const userId = args[0];
    const reason = args.slice(1).join(" ") || "No especificado";

    if (!userId) {
      return message.reply("❌ Debes proporcionar el ID del usuario.");
    }

    // Cargamos warns
    const warns = loadWarns();

    if (!warns[userId]) warns[userId] = [];

    const warn = {
      moderator: message.author.id,
      reason: reason,
      date: new Date().toISOString(),
    };

    warns[userId].push(warn);
    saveWarns(warns);

    // Embed de confirmación
    const embed = new EmbedBuilder()
      .setTitle("⚠️ Nuevo Warn")
      .setColor("Orange")
      .addFields(
        { name: "Usuario", value: `<@${userId}> (${userId})`, inline: false },
        { name: "Moderador", value: `<@${message.author.id}>`, inline: false },
        { name: "Razón", value: reason, inline: false },
        { name: "Fecha", value: new Date().toLocaleString("es-ES"), inline: false }
      );

    return message.channel.send({ embeds: [embed] });
  },
};
