import fs from "fs";

export default {
  name: "unmute",
  description: "Quita mute por ID",
  async execute(message, args, client) {
    if (!message.member.roles.cache.some(r => ["admin", "mod"].includes(r.name))) {
      return message.reply("❌ No tienes permisos.");
    }

    const userId = args[0];
    if (!userId) return message.reply("⚠️ Uso: `>unmute [ID]`");

    try {
      const member = await message.guild.members.fetch(userId);
      await member.timeout(null);
      await message.channel.send(`🔊 ${member.user.tag} ha sido desmuteado.`);

      const { logModAction } = await import("../../features/modlog.js");
      const config = JSON.parse(fs.readFileSync("./config.json"));
      await logModAction(client, config, {
        type: "unmute",
        userId,
        moderatorId: message.author.id,
        reason: "Unmute manual"
      });
    } catch (err) {
      console.error(err);
      message.reply("❌ No pude desmutear al usuario.");
    }
  }
};
