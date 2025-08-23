if (command === 'unmute') {
    if (!message.member.permissions.has('MODERATE_MEMBERS')) {
        return message.reply("❌ No tienes permisos para usar este comando.");
    }
    const userId = args[0];
    if (!userId) return message.reply("⚠️ Debes especificar un ID de usuario.");

    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member) return message.reply("⚠️ Usuario no encontrado en este servidor.");

    member.timeout(null)
        .then(() => message.reply(`🔊 Usuario **${userId}** ha sido desmuteado.`))
        .catch(err => {
            console.error(err);
            message.reply("❌ No pude desmutear a este usuario.");
        });
}