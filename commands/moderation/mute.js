import fs from "fs";

export default {
  name: "mute",
  description: "Silencia por ID",
  async execute(message, args, client) {
    if (!message.member.roles.cache.some(r => ["admin", "mod"].includes(r.name))) {
      return message.reply("❌ No tienes permisos.");
    }

    const userId = args[0];
    const duration = parseInt(args[1]) || 10; // minutos
    const reason = args.slice(2).join(" ") || "No especificada";
    if (!userId) return message.reply("⚠️ Uso: `>mute [ID] [minutos] [razón]`");

    try {
      const member = await message.guild.members.fetch(userId);
      await member.timeout(duration * 60 * 1000, reason);
      await message.channel.send(`🔇 ${member.user.tag} muteado ${duration}m.`);

      const { logModAction } = await import("../../features/modlog.js");
      const config = JSON.parse(fs.readFileSync("./config.json"));
      await logModAction(client, config, {
        type: "mute",
        userId,
        moderatorId: message.author.id,
        reason
      });
    } catch (err) {
      console.error(err);
      message.reply("❌ No pude mutear al usuario.");
    }
  }
};
