// /commands/moderation/kick.js (ESM)
function hasStaffRole(member) {
  return member.roles.cache.some(r => ["admin", "mod"].includes(r.name.toLowerCase()));
}

export default {
  name: "kick",
  description: "Expulsar por ID",
  async execute(message, args) {
    if (!hasStaffRole(message.member)) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    const userId = args[0];
    const reason = args.slice(1).join(" ") || `Expulsado por ${message.author.tag}`;
    if (!userId) return message.reply("⚠️ Debes proporcionar la **ID** del usuario.");

    try {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (!member) return message.reply("❌ Ese usuario no está en el servidor.");
      if (!member.kickable) return message.reply("❌ No puedo expulsar a ese usuario.");

      await member.kick(reason);
      return message.channel.send(`✅ ${member.user.tag} expulsado. Razón: ${reason}`);
    } catch (err) {
      console.error(err);
      return message.reply("❌ No pude expulsar al usuario.");
    }
  },
};
