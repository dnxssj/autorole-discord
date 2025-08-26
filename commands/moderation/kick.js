import fs from "fs";

export default {
  name: "kick",
  description: "Expulsa por ID",
  async execute(message, args, client) {
    if (!message.member.roles.cache.some(r => ["admin", "mod"].includes(r.name))) {
      return message.reply("❌ No tienes permisos para usar este comando.");
    }

    const userId = args[0];
    const reason = args.slice(1).join(" ") || "No especificada";
    if (!userId) return message.reply("⚠️ Debes dar el ID: `>kick [ID] [razón]`");

    try {
      const member = await message.guild.members.fetch(userId);
      if (!member.kickable) return message.reply("❌ No puedo expulsar a ese usuario.");
      await member.kick(reason);
      await message.channel.send(`✅ ${member.user.tag} fue expulsado.`);

      const { logModAction } = await import("../../features/modlog.js");
      const config = JSON.parse(fs.readFileSync("./config.json"));
      await logModAction(client, config, {
        type: "kick",
        userId,
        moderatorId: message.author.id,
        reason
      });
    } catch (err) {
      console.error(err);
      message.reply("❌ Error expulsando al usuario.");
    }
  }
};
