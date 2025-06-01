import './keep_alive.js';
import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import { createCanvas, loadImage, registerFont } from 'canvas';
registerFont('./fonts/static/Roboto-Bold.ttf', { family: 'Roboto' });
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const config = JSON.parse(fs.readFileSync('./config.json'));
const xpFile = './xp.json';
let xpData = fs.existsSync(xpFile) ? JSON.parse(fs.readFileSync(xpFile)) : {};
const parejasFile = './parejas.json';
let parejasData = fs.existsSync(parejasFile) ? JSON.parse(fs.readFileSync(parejasFile)) : {};
const amistadesFile = './amistades.json';
let amistadesData = fs.existsSync(amistadesFile) ? JSON.parse(fs.readFileSync(amistadesFile)) : {};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('ready', async () => {
  console.log(`✅ Conectado como ${client.user.tag}`);
  const channel = await client.channels.fetch(config.channelId);

  const activities = [
    { name: 'cómo el churumbel se jode el hombro', type: 3 },
    { name: 'con tus emociones', type: 0 },
    { name: 'murcianadas 🫠', type: 2 }
  ];
  let i = 0;
  client.user.setPresence({ status: 'online', activities: [activities[i++ % activities.length]] });
  setInterval(() => {
    client.user.setPresence({ status: 'online', activities: [activities[i++ % activities.length]] });
  }, 1800000);

  if (!config.colorMessageId) {
    const embed = new EmbedBuilder()
      .setTitle('🎨 Colores de Nickname – Selección Actual')
      .setDescription('**Elige un color de nickname**:\n\n🔴 → rojo_coral\n🟠 → naranja_dorado\n🟣 → lila_vibrante\n🔵 → celeste_pastel\n🟢 → verde_menta\n🌸 → rosa_pastel\n⚫ → gris_carbon\n🤍 → blanco\n🟡 → amarillo_crema\n')
      .setColor(0x9b59b6);

    const msg = await channel.send({ embeds: [embed] });
    for (const emoji of Object.keys(config.colorRoles)) await msg.react(emoji);
    config.colorMessageId = msg.id;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot || !reaction.message.guild) return;
  const member = await reaction.message.guild.members.fetch(user.id);
  const { colorRoles } = config;
  if (reaction.message.id === config.colorMessageId) {
    const roleName = colorRoles[reaction.emoji.name];
    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return;
    for (const name of Object.values(colorRoles)) {
      const r = reaction.message.guild.roles.cache.find(ro => ro.name === name);
      if (r && member.roles.cache.has(r.id)) await member.roles.remove(r);
    }
    await member.roles.add(role).catch(console.error);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot || !reaction.message.guild) return;
  const member = await reaction.message.guild.members.fetch(user.id);
  const roleName = config.colorRoles[reaction.emoji.name];
  const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
  if (role && member.roles.cache.has(role.id)) await member.roles.remove(role).catch(console.error);
});

// XP & !rank
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  if (!xpData[userId]) xpData[userId] = { xp: 0, level: 0, lastRank: null };
  const userXp = xpData[userId];
  userXp.xp += Math.floor(Math.random() * 10) + 5;

  const level = Math.floor(0.1 * Math.sqrt(userXp.xp));
  const getRequiredXp = lvl => Math.floor(Math.pow((lvl + 1) / 0.1, 2));
  const rankRoles = { 10: 'Nivel 1 ~ Nova', 50: 'Nivel 2 ~ Spectra', 100: 'Nivel 3 ~ Blight', 200: 'Nivel 4 ~ Cyanite', 300: 'Nivel 5 ~ Velkyr', 400: 'Nivel 6 ~ Oblivion', 500: 'Nivel 7 ~ Sunfall', 600: 'Nivel 8 ~ Cryora', 800: 'Nivel 9 ~ Ashen', 1000: 'Nivel 10 ~ Zenthyr', 5000: 'YAPPER', 10000: 'VIP' };
  const getRankName = lvl => {
    return Object.entries(rankRoles).reverse().find(([l]) => lvl >= l)?.[1] || null;
  };

  if (level > userXp.level) {
    userXp.level = level;
    const rankName = getRankName(level);
    const announce = await client.channels.fetch(config.levelUpChannelId).catch(() => null);
    if (announce) announce.send({ embeds: [new EmbedBuilder().setTitle('📈 ¡Nuevo nivel!').setDescription(`${message.author} subió a nivel **${level}**.`).setColor(0x00bfff)] });
    if (rankName && userXp.lastRank !== rankName) {
      const member = message.member;
      for (const r of Object.values(rankRoles)) {
        const role = message.guild.roles.cache.find(ro => ro.name === r);
        if (role && member.roles.cache.has(role.id)) await member.roles.remove(role);
      }
      const newRole = message.guild.roles.cache.find(r => r.name === rankName);
      if (newRole) await member.roles.add(newRole).catch(console.error);
      userXp.lastRank = rankName;
    }
  }
  fs.writeFileSync(xpFile, JSON.stringify(xpData, null, 2));

  if (message.content.startsWith('!rank')) {
    const target = message.mentions.users.first() || message.author;
    const member = await message.guild.members.fetch(target.id);
    const xp = userXp.xp;
    const required = getRequiredXp(level);
    const progressBar = '▰'.repeat(Math.floor((xp / required) * 10)) + '▱'.repeat(10 - Math.floor((xp / required) * 10));
    const embed = new EmbedBuilder()
      .setTitle(`📊 Perfil de ${member.displayName}`)
      .addFields(
        { name: 'Nivel', value: `${level}`, inline: true },
        { name: 'XP', value: `\`${xp} / ${required}\`
${progressBar}`, inline: true },
        { name: 'Rango', value: userXp.lastRank || 'Sin rango', inline: false }
      ).setColor(0x5865f2);
    message.reply({ embeds: [embed] });
  }
});

// Sistema de Parejas y comandos !me, !marryme, !divorce, !relación
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const authorId = message.author.id;

  if (message.content === '!backup') {
    const allowedIds = [process.env.ADMIN_ID_1, process.env.ADMIN_ID_2];
    if (!allowedIds.includes(message.author.id)) {
      return message.reply('Este comando es solo para usuarios autorizados.');
    }

    const archivos = ['xp.json', 'parejas.json', 'amistades.json'].filter(file => fs.existsSync(`./${file}`));
    if (archivos.length === 0) return message.reply('No hay archivos para respaldar.');

    try {
      await message.author.send({
        content: '📦 Aquí tienes los archivos de backup actuales:',
        files: archivos.map(file => ({ attachment: `./${file}`, name: file }))
      });
      message.reply('✅ Backup enviado por mensaje privado.');
    } catch (error) {
      message.reply('❌ No pude enviarte el mensaje privado. ¿Tienes los DMs desactivados?');
    }
  }



if (message.content === '!help') {
  const helpEmbed = new EmbedBuilder()
    .setTitle('🤖 Comandos disponibles')
    .setColor(0x9b59b6)
    .setDescription('Aquí tienes una lista de comandos que puedes usar con este bot:')
    .addFields(
      {
        name: '🧪 Sistema de niveles',
        value: '`!rank [@usuario]` – Muestra tu nivel, XP y rango actual.\n`!me [@usuario]` – Perfil detallado del usuario: roles, XP, estado civil, etc.'
      },
      {
        name: '💘 Sistema de parejas',
        value: '`!marryme @usuario` – Envía una propuesta de pareja.\n`!divorce` – Solicita el divorcio con confirmación de la pareja.\n`!relacion` – Muestra tu pareja actual si tienes una.'
      },
      {
        name: '🌟 Sistema de amistad',
        value: '`!bffme @usuario` – Propón una amistad (solo una activa a la vez).'
      },
      {
        name: '🤣 Entretenimiento',
        value: '`!murcia` – Muestra un chiste aleatorio sobre Murcia.'
      }
    )
    .setFooter({ text: 'Bot desarrollado por DNX - Dexter\'s Lab' });

  message.reply({ embeds: [helpEmbed] });
}

  if (message.content === '!relacion') {
    const parejaId = parejasData[authorId];
    if (!parejaId) return message.reply('💔 Actualmente no tienes pareja registrada.');
    const pareja = await message.guild.members.fetch(parejaId).catch(() => null);
    return message.reply(pareja ? `💞 Tu pareja es **${pareja.displayName}**.` : '😢 Tu pareja ya no está en el servidor.');
  }

  if (message.content.startsWith('!me')) {
  const targetUser = message.mentions.users.first() || message.author;
  const member = await message.guild.members.fetch(targetUser.id);
  const userData = xpData[targetUser.id] || { xp: 0, level: 0, lastRank: 'Sin rango' };
  const pareja = parejasData[targetUser.id] ? `<@${parejasData[targetUser.id]}> ❤️` : 'Solter@ 💔';
  const bff = amistadesData[targetUser.id] ? `<@${amistadesData[targetUser.id]}> 🌟` : 'Sin mejor amig@ 😢';

  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  // Fondo
  ctx.fillStyle = '#1e1e2f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Avatar
  const avatar = await loadImage(targetUser.displayAvatarURL({ format: 'png' }));
  ctx.drawImage(avatar, 30, 30, 100, 100);

  // Texto principal
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Sans';
  ctx.fillText(`Perfil de ${member.displayName}`, 150, 60);

  // Nivel y XP
  ctx.font = '20px Sans';
  ctx.fillText(`Nivel: ${userData.level}`, 150, 100);
  ctx.fillText(`XP: ${userData.xp}`, 150, 130);

  // Estado civil y BFF
  ctx.fillText(`💘 Estado civil: ${pareja}`, 150, 170);
  ctx.fillText(`🌟 BFF: ${bff}`, 150, 200);

  // Enviar imagen
  const buffer = canvas.toBuffer('image/png');
  message.reply({ files: [{ attachment: buffer, name: 'perfil.png' }] });
}




if (message.content.startsWith('!marryme')) {
  const target = message.mentions.users.first();
  const authorId = message.author.id;

  if (!target || target.bot || target.id === authorId)
    return message.reply('Menciona a una persona válida.');

  const emparejado = Object.entries(parejasData).some(([uid, pid]) =>
    [uid, pid].includes(authorId) || [uid, pid].includes(target.id)
  );

  if (emparejado)
    return message.reply('Uno de los dos ya tiene pareja.');

  const msg = await message.channel.send(
    `${target}, ${message.author} quiere ser tu pareja 💍\n¿Aceptas? ✅ o ❌`
  );

  await msg.react('✅');
  await msg.react('❌');

  msg.awaitReactions({
    filter: (r, u) =>
      ['✅', '❌'].includes(r.emoji.name) && u.id === target.id,
    max: 1,
    time: 60000,
    errors: ['time']
  })
    .then(collected => {
      if (collected.first().emoji.name === '✅') {
        parejasData[authorId] = target.id;
        parejasData[target.id] = authorId;
        fs.writeFileSync(parejasFile, JSON.stringify(parejasData, null, 2));

        message.channel.send({
          content: `💖 ¡${message.author} y ${target} ahora son pareja! 🎉\nhttps://tenor.com/view/inuyasha-shippo-funny-anime-gif-24104596`
        });
      } else {
        message.channel.send('😢 Propuesta rechazada.');
      }
    })
    .catch(() => message.channel.send('⏰ Tiempo agotado.'));
}


if (message.content === '!divorce') {
  const authorId = message.author.id;
  const parejaId = parejasData[authorId];

  if (!parejaId) {
    return message.reply('No estás en pareja actualmente 💔');
  }

  const parejaUser = await message.guild.members.fetch(parejaId).catch(() => null);
  if (!parejaUser) {
    delete parejasData[authorId];
    delete parejasData[parejaId];
    fs.writeFileSync(parejasFile, JSON.stringify(parejasData, null, 2));
    return message.reply('Tu pareja ya no está en el servidor. Se ha terminado la relación.');
  }

  const confirmMsg = await message.channel.send(
    `${parejaUser}, ${message.author} quiere divorciarse de ti 💔\n¿Aceptas? ✅ o ❌`
  );

  await confirmMsg.react('✅');
  await confirmMsg.react('❌');

  confirmMsg.awaitReactions({
    filter: (reaction, user) =>
      ['✅', '❌'].includes(reaction.emoji.name) && user.id === parejaId,
    max: 1,
    time: 60000,
    errors: ['time']
  })
    .then(collected => {
      const reaction = collected.first();

      if (reaction.emoji.name === '✅') {
        delete parejasData[authorId];
        delete parejasData[parejaId];
        fs.writeFileSync(parejasFile, JSON.stringify(parejasData, null, 2));

        message.channel.send({
          content: `💔 ${message.author} y ${parejaUser} ya no están juntos...\nhttps://tenor.com/view/divorce-gif-20541960`
        });
      } else {
        message.channel.send('😢 El divorcio ha sido rechazado.');
      }
    })
    .catch(() => {
      message.channel.send('⏰ Tiempo agotado. No se ha confirmado el divorcio.');
    });
}




  if (message.content.startsWith('!bffme')) {
  const target = message.mentions.users.first();
  if (!target || target.bot) return message.reply('Debes mencionar a una persona válida.');

  const authorId = message.author.id;
  const targetId = target.id;

  if (amistadesData[authorId] === targetId || amistadesData[targetId] === authorId) {
    return message.reply('¡Ya sois mejores amigos! 💛');
  }

  const confirmMsg = await message.channel.send({
    content: `${target}, ${message.author} quiere ser tu mejor amig@ 🌟\n¿Aceptas? Reacciona con ✅ o ❌`,
  });

  await confirmMsg.react('✅');
  await confirmMsg.react('❌');

  const filter = (reaction, user) =>
    ['✅', '❌'].includes(reaction.emoji.name) && user.id === targetId;

  confirmMsg.awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] })
    .then(collected => {
      const reaction = collected.first();

      if (reaction.emoji.name === '✅') {
        amistadesData[authorId] = targetId;
        amistadesData[targetId] = authorId;
        fs.writeFileSync(amistadesFile, JSON.stringify(amistadesData, null, 2));
        message.channel.send(`🤝 ¡${message.author} y ${target} ahora son mejores amigos! 🎉`);
      } else {
        message.channel.send(`😢 ${message.author}, ${target} ha rechazado tu solicitud de amistad.`);
      }
    })
    .catch(() => {
      message.channel.send('⏰ Tiempo agotado, no se ha confirmado la amistad.');
    });
}

  if (message.content === '!murcia') {
      const chistes = [
        '¿Por qué en Murcia no usan GPS? Porque todos los caminos llevan a una huerta.',
        '? qué es Murcia?',
        'Murcia no existe, chaval',
        'No me se chistes sobre desiertos',
        '¿Cómo se llama un murciano sin acento? ¡Turista!',
        '—Oye Paco, ¿y esa camisa tan chula? —Es de Huertza Prímavhera, la tienda más fashion de Murcia.',
        'En Murcia no llueve, el cielo solo riega las lechugas.',
        'Dicen que en Murcia las verduras se asustan cuando oyen “gazpacho”.',
        '¿Sabes cómo se dice “wifi” en Murcia? Guifí, primo.',
        '¿Por qué en Murcia no hacen películas de miedo? Porque ya tienen el calor de agosto.',
        '¿Cómo se saluda un murciano elegante? ¡Muy güeno todo, señó!'
      ];
      const random = Math.floor(Math.random() * chistes.length);
      await message.reply(chistes[random]);
    }

});

client.login(process.env.TOKEN);
