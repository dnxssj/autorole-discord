import './keep_alive.js';
import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const config = JSON.parse(fs.readFileSync('./config.json'));
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

  if (!config.colorMessageId) {
    const embed = new EmbedBuilder()
      .setTitle('🎨 Colores de Nickname – Selección Actual')
      .setDescription(
        '**Elige un color de nickname**:\n\n' +
        '🔴 → rojo_coral\n' +
        '🟠 → naranja_dorado\n' +
        '🟣 → lila_vibrante\n' +
        '🔵 → celeste_pastel\n' +
        '🟢 → verde_menta\n' +
        '🌸 → rosa_pastel\n' +
        '⚫ → gris_carbon\n' +
        '🤍 → blanco\n' +
        '🟡 → amarillo_crema\n\n'
      )
      .setColor(0x9b59b6);

    const msg = await channel.send({ embeds: [embed] });
    for (const emoji of Object.keys(config.colorRoles)) {
      await msg.react(emoji);
    }
    config.colorMessageId = msg.id;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot || !reaction.message.guild) return;
  const member = await reaction.message.guild.members.fetch(user.id);

  const { colorRoles } = config;
  const isColor = reaction.message.id === config.colorMessageId;

  if (isColor) {
    const roleName = colorRoles[reaction.emoji.name];
    const group = Object.values(colorRoles);
    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return;

    for (const name of group) {
      const r = reaction.message.guild.roles.cache.find(ro => ro.name === name);
      if (r && member.roles.cache.has(r.id)) await member.roles.remove(r);
    }

    await member.roles.add(role).catch(console.error);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot || !reaction.message.guild) return;
  const member = await reaction.message.guild.members.fetch(user.id);

  const { colorRoles } = config;
  const roleName = colorRoles[reaction.emoji.name];
  const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
  if (role && member.roles.cache.has(role.id)) {
    await member.roles.remove(role).catch(console.error);
  }
});

// --- SISTEMA DE XP Y RANGOS ---

const xpFile = './xp.json';
let xpData = fs.existsSync(xpFile) ? JSON.parse(fs.readFileSync(xpFile)) : {};

function getLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

function getRequiredXp(level) {
  return Math.floor(Math.pow((level + 1) / 0.1, 2));
}

const rankRoles = {
  10: 'Nova',
  50: 'Spectra',
  100: 'Blight',
  200: 'Cyanite',
  300: 'Velkyr',
  400: 'Oblivion',
  500: 'Sunfall',
  600: 'Cryora',
  800: 'Ashen',
  1000: 'Zenthyr',
  5000: 'YAPPER',
  10000: 'VIP'
};

function getRankName(level) {
  const levels = Object.keys(rankRoles).map(Number).sort((a, b) => a - b);
  for (let i = levels.length - 1; i >= 0; i--) {
    if (level >= levels[i]) return rankRoles[levels[i]];
  }
  return null;
}

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  if (!xpData[userId]) {
    xpData[userId] = { xp: 0, level: 0, lastRank: null };
  }

  const userXp = xpData[userId];
  userXp.xp += Math.floor(Math.random() * 10) + 5;

  const newLevel = getLevel(userXp.xp);
  if (newLevel > userXp.level) {
    userXp.level = newLevel;

    const rankName = getRankName(newLevel);
    const announceChannel = await client.channels.fetch(config.levelUpChannelId).catch(() => null);
    if (announceChannel) {
      const embed = new EmbedBuilder()
        .setTitle('📈 ¡Nuevo nivel alcanzado!')
        .setDescription(`${message.author} ha subido al nivel **${newLevel}**.`)
        .setColor(0x00bfff);
      await announceChannel.send({ embeds: [embed] });
    }

    if (rankName && userXp.lastRank !== rankName) {
      const currentRanks = Object.values(rankRoles);
      const member = message.member;
      const guild = message.guild;

      for (const rName of currentRanks) {
        const role = guild.roles.cache.find(r => r.name === rName);
        if (role && member.roles.cache.has(role.id)) await member.roles.remove(role);
      }

      const newRole = guild.roles.cache.find(r => r.name === rankName);
      if (newRole) {
        await member.roles.add(newRole).catch(console.error);
        userXp.lastRank = rankName;
      }
    }
  }

  fs.writeFileSync(xpFile, JSON.stringify(xpData, null, 2));
});

client.on('messageCreate', message => {
  if (message.content === '!xp' && !message.author.bot) {
    const userId = message.author.id;
    const data = xpData[userId] || { xp: 0, level: 0 };
    const nextLevelXp = getRequiredXp(data.level);
    message.reply(
      `📊 Nivel: ${data.level}\n` +
      `🔹 XP: ${data.xp} / ${nextLevelXp} para el siguiente nivel.`
    );
  }
});

client.login(process.env.TOKEN);
