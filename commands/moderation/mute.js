// /commands/moderation/mute.js (ESM)
function hasStaffRole(member) {
  return member.roles.cache.some(r => ["admin", "mod"].includes(r.name.toLowerCase()));
}

export default {
  name: "mute",
  description: "Silenciar por ID (timeout)",
  async execute(message, args) {
    if (!hasStaffRole(message.member)) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    const userId = args[0];
    const minutes = parseInt(args[1], 10) || 10;
    const reason = args.slice(2).join(" ") || `Muteado por ${message.author.tag}`;
    if (!userId) return message.reply("⚠️ Debes proporcionar la **ID** del usuario.");

    try {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (!member) return message.reply("❌ Ese usuario no está en el servidor.");
      if (!member.moderatable) return message.reply("❌ No puedo aplicar timeout a ese usuario.");

      const ms = Math.max(1, minutes) * 60 * 1000;
      await member.timeout(ms, reason);
      return message.channel.send(`🔇 ${member.user.tag} muteado ${minutes} min. Razón: ${reason}`);
    } catch (err) {
      console.error(err);
      return message.reply("❌ No pude mutear al usuario. Verifica permisos del bot.");
    }
  },
};
