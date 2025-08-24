// /commands/moderation/unmute.js (ESM)
function hasStaffRole(member) {
  return member.roles.cache.some(r => ["admin", "mod"].includes(r.name.toLowerCase()));
}

export default {
  name: "unmute",
  description: "Quitar silencio por ID",
  async execute(message, args) {
    if (!hasStaffRole(message.member)) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    const userId = args[0];
    if (!userId) return message.reply("⚠️ Debes proporcionar la **ID** del usuario.");

    try {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (!member) return message.reply("❌ Ese usuario no está en el servidor.");

      await member.timeout(null);
      return message.channel.send(`🔊 ${member.user.tag} ha sido desmuteado.`);
    } catch (err) {
      console.error(err);
      return message.reply("❌ No pude desmutear al usuario.");
    }
  },
};
