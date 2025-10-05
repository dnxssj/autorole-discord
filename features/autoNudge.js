// features/autoNudge.js (ESM)
export function initAutoNudge(client, config) {
  // Canal donde se enviarán los nudges (p.ej. #general)
  const nudgeChannelId = config.nudgeChannelId || config.welcomeChannelId || config.channelId;

  // Canal de autoroles/colores para mencionarlo en el mensaje
  const rolesChannelId = config.rolesChannelId || config.channelId; 
  const rolesMention = rolesChannelId ? `<#${rolesChannelId}>` : '#autoroles';

  const everyHours = Number(config.nudgeIntervalHours ?? 6);
  const intervalMs = Math.max(1, everyHours) * 60 * 60 * 1000;

  const messages = [
    `💬 ¡Hora de charlar! Por participar ganas **XP** y hay recompensas por nivel. ¿Ya elegiste tu color en ${rolesMention}?`,
    `⭐ Recuerda: chateando subes de nivel y desbloqueas **recompensas**. Cambia el color de tu nombre en ${rolesMention}.`,
    `⚡ Sube de nivel hablando por el chat: consigues **XP** + premios. Autoroles y colores en ${rolesMention}.`,
    `🎯 Tip: hablar = **XP**. Mira los roles de color y más en ${rolesMention}.`
  ];
  const pick = () => messages[Math.floor(Math.random() * messages.length)];

  client.once('ready', async () => {
    const channel = await client.channels.fetch(nudgeChannelId).catch(() => null);
    if (!channel) return;

    // (Opcional) primer mensaje tras 30s
    setTimeout(() => channel.send(pick()).catch(() => null), 30_000);

    // Mensaje repetido cada X horas
    setInterval(() => channel.send(pick()).catch(() => null), intervalMs);
  });
}
