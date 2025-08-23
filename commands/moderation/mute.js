if (command === 'mute') {
    if (!message.member.permissions.has('MODERATE_MEMBERS')) {
        return message.reply("❌ No tienes permisos para usar este comando.");
    }
    const userId = args[0];
    const duration = args[1] ? ms(args[1]) : ms('10m'); // si no se da tiempo → 10m
    if (!userId) return message.reply("⚠️ Debes especificar un ID de usuario.");

    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member) return message.reply("⚠️ Usuario no encontrado en este servidor.");

    member.timeout(duration, `Muteado por ${message.author.tag}`)
        .then(() => message.reply(`🔇 Usuario **${userId}** muteado por ${args[1] || '10m'}.`))
        .catch(err => {
            console.error(err);
            message.reply("❌ No pude mutear a este usuario.");
        });
}