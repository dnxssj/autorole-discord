// features/specialPhraseReplies.js
function makeMatcher({ pattern, regex = false, flags = "i", wholeWord = false }) {
  if (regex) return new RegExp(pattern, flags);
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const core = wholeWord ? `\\b${escaped}\\b` : escaped;
  return new RegExp(core, flags);
}

export function initSpecialPhraseReplies(client, config) {
  const cfg = config.specialPhrase;
  if (!cfg || !cfg.userId || !cfg.pattern) return;

  const matcher = makeMatcher(cfg);
  const ignoreBots  = cfg.ignoreBots !== false;      // por defecto ignora bots
  const cooldownSec = Number(cfg.cooldownSec ?? 5);
  const channels    = Array.isArray(cfg.channels) ? cfg.channels : null; // opcional
  const lastByChan  = new Map(); // anti-spam por canal

  client.on("messageCreate", async (message) => {
    try {
      if (!message.guild) return;
      if (ignoreBots && message.author?.bot) return;
      if (channels && !channels.includes(message.channelId)) return;
      if (!matcher.test(message.content)) return;

      // cooldown por canal
      const now = Date.now();
      const next = lastByChan.get(message.channelId) || 0;
      if (now < next) return;
      lastByChan.set(message.channelId, now + cooldownSec * 1000);

      // responder distinto si es el user especial o no
      if (message.author.id === cfg.userId) {
        if (cfg.replyWhenUser) await message.reply(cfg.replyWhenUser).catch(() => null);
      } else {
        if (cfg.replyWhenOthers) await message.reply(cfg.replyWhenOthers).catch(() => null);
      }
    } catch { /* no romper el bot */ }
  });
}
