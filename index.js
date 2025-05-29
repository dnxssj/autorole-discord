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

  // Mensaje de roles de color
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
        '🟡 → amarillo_dorado\n\n'
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
  if (user.bot) return;
  if (!reaction.message.guild) return;
  const member = await reaction.message.guild.members.fetch(user.id);

  const { colorRoles } = config;
  const isColor = reaction.message.id === config.colorMessageId;

  if (isColor) {
    const roleName = colorRoles[reaction.emoji.name];
    const group = Object.values(colorRoles);

    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return;

    // Eliminar roles anteriores del grupo de colores
    for (const name of group) {
      const r = reaction.message.guild.roles.cache.find(ro => ro.name === name);
      if (r && member.roles.cache.has(r.id)) await member.roles.remove(r);
    }

    await member.roles.add(role).catch(console.error);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (!reaction.message.guild) return;
  const member = await reaction.message.guild.members.fetch(user.id);

  const { colorRoles } = config;
  const roleName = colorRoles[reaction.emoji.name];
  const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
  if (role && member.roles.cache.has(role.id)) {
    await member.roles.remove(role).catch(console.error);
  }
});

client.login(process.env.TOKEN);
