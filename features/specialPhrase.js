// features/specialPhrase.js
function normalize(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[?!¡¿.,:;'\"`~^()\[\]{}<>]/g, "")       // quita signos
    .replace(/\s+/g, " ")
    .trim();
}

function makeMatcher({ pattern, regex = false, flags = "i", wholeWord = false }) {
  // OJO: el matching se hará sobre texto normalizado, así que
  // - si regex=true, el patrón debe venir ya normalizado (sin tildes ni signos)
  // - si regex=false, lo normalizamos y escapamos aquí
  if (regex) return new RegExp(pattern, flags);
  const patNorm = normalize(pattern);
  const escaped = patNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const core = wholeWord ? `\\b${escaped}\\b` : escaped;
  return new RegExp(core, flags);
}

export function initSpecialPhrase(client, config) {
  const cfg = config?.specialPhrase;
  if (!cfg || !cfg.userId || !cfg.pattern) return;

  const matcher     = makeMatcher(cfg);
  const ignoreBots  = cfg.ignoreBots !== false;                // por defecto ignora bots
  const cooldownSec = Number(cfg.cooldownSec ?? 5);
  const channels    = Array.isArray(cfg.channels) && cfg.channels.length
    ? cfg.channels.map(String)
    : null;

  // cooldown por guild+canal
  const lastByKey = new Map();

  client.on("messageCreate", async (message) => {
    try {
      if (!message.guild) return;
      if (ignoreBots && message.author?.bot) return;
      if (channels && !channels.includes(String(message.channelId))) return;

      // normalizamos contenido
      const contentNorm = normalize(message.content);

      // si usas regex=true, escribe el patrón ya normalizado
      if (!matcher.test(contentNorm)) return;

      const key = `${message.guild.id}:${message.channelId}`;
      const now = Date.now();
      if (now < (lastByKey.get(key) || 0)) return;
      lastByKey.set(key, now + cooldownSec * 1000);

      const isSpecial = String(message.author.id) === String(cfg.userId);
      const replyTxt = isSpecial ? cfg.replyWhenUser : cfg.replyWhenOthers;
      if (replyTxt) await message.reply(replyTxt).catch(() => null);
    } catch (e) {
      console.error("[specialPhrase] error:", e);
    }
  });
}
