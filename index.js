import './keep_alive.js';
import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { createCanvas, loadImage, registerFont } from 'canvas';

registerFont('./fonts/static/Roboto-Bold.ttf', { family: 'Roboto', weight: 'bold' });
registerFont('./fonts/static/Roboto-Light.ttf', { family: 'Roboto', weight: 'light' });

dotenv.config();
const config = JSON.parse(fs.readFileSync('./config.json'));

const xpFile = './xp.json';
let xpData = fs.existsSync(xpFile) ? JSON.parse(fs.readFileSync(xpFile)) : {};

const getRequiredXp = lvl => Math.floor(Math.pow((lvl + 1) / 0.1, 2));

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

// ... código anterior intacto ...

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  if (message.content.startsWith('!me')) {
    const userId = message.mentions.users.first()?.id || message.author.id;
    const user = await message.guild.members.fetch(userId);
    const avatarURL = user.user.displayAvatarURL({ extension: 'png', forceStatic: true, size: 128 });

    const userData = xpData[userId] || { xp: 0, level: 0, lastRank: null };
    const pareja = 'Lerka'; // ejemplo
    const bff = 'Nico'; // ejemplo

    const canvas = createCanvas(600, 600);
    const ctx = canvas.getContext('2d');

    const fondo = await loadImage('./me_background_discord.jpg');
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

    // Avatar con borde blanco
    const avatar = await loadImage(avatarURL);
    const cx = canvas.width / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, 110, 66, 0, Math.PI * 2);
    ctx.fillStyle = '#7FB3D5';
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(cx, 110, 64, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, cx - 64, 46, 128, 128);
    ctx.restore();

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';

    // Nombre
    ctx.font = 'bold 36px Roboto';
    ctx.fillText(user.displayName.toUpperCase(), cx, 210);

    ctx.font = '22px Roboto';
    ctx.fillText(`Nivel: ${userData.level}`, cx, 250);
    ctx.fillText(`XP: ${userData.xp}`, cx, 280);
    ctx.fillText(`Estado civil: ${pareja}`, cx, 320);
    ctx.fillText(`Mejor amig@: ${bff}`, cx, 350);

// Barra de progreso XP mejorada
const xp = userData.xp;
const level = userData.level;
const requiredXp = getRequiredXp(level);
const barWidth = 300;
const barHeight = 24;
const barX = (canvas.width - barWidth) / 2;
const barY = 400;
const progress = Math.min(xp / requiredXp, 1);

// Fondo de la barra (borde claro)
ctx.fillStyle = '#ddd';
ctx.roundRect(barX, barY, barWidth, barHeight, 12);
ctx.fill();

// Barra de progreso con degradado
const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
gradient.addColorStop(0, '#7FB3D5');  // azul claro
gradient.addColorStop(1, '#4A90E2');  // azul fuerte
ctx.fillStyle = gradient;
ctx.roundRect(barX, barY, barWidth * progress, barHeight, 12);
ctx.fill();

// Borde
ctx.strokeStyle = '#444';
ctx.lineWidth = 2;
ctx.roundRect(barX, barY, barWidth, barHeight, 12);
ctx.stroke();

// Texto centrado dentro
ctx.font = '18px Roboto';
ctx.fillStyle = '#000';
ctx.textAlign = 'center';
ctx.fillText(`${xp} / ${requiredXp}`, canvas.width / 2, barY + 17);


    const buffer = canvas.toBuffer('image/png');
    await message.reply({ files: [{ attachment: buffer, name: 'perfil.png' }] });
  }
});

client.login(process.env.TOKEN);
