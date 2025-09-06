// features/autoBackup.js
import fs from "fs";

const HOURS = 6;
const INTERVAL_MS = HOURS * 60 * 60 * 1000;

// Archivos a respaldar (los mismos que tu comando)
const FILES = [
  "xp.json",
  "parejas.json",
  "amistades.json",
  "claimCooldowns.json",
  "registros.json",
];

function getExistingFiles() {
  return FILES
    .filter(f => fs.existsSync(`./${f}`))
    .map(f => ({ attachment: `./${f}`, name: f }));
}

async function sendBackupToUser(user) {
  const files = getExistingFiles();
  if (files.length === 0) {
    // nada que enviar; no consideramos esto como error
    return;
  }
  await user.send({
    content: `📦 Backup automático (cada ${HOURS}h)`,
    files,
  });
}

export function initAutoBackup(client) {
  // Lee IDs de admin desde .env (usa lo que ya tienes para el comando)
  const adminIds = [process.env.ADMIN_ID_1, process.env.ADMIN_ID_2]
    .filter(Boolean);

  if (adminIds.length === 0) {
    console.warn("[autoBackup] No hay ADMIN_ID_1/ADMIN_ID_2 configurados. Se desactiva el auto-backup.");
    return;
  }

  const runOnce = async () => {
    for (const id of adminIds) {
      try {
        const user = await client.users.fetch(id);
        await sendBackupToUser(user);
      } catch (err) {
        // DM cerrado o usuario no accesible; seguimos con el siguiente
        console.error(`[autoBackup] No pude enviar backup a ${id}:`, err?.message || err);
      }
    }
  };

  // Ejecuta uno al arrancar (con pequeño delay para que el bot esté listo)
  setTimeout(runOnce, 60 * 1000);

  // Programa cada 6 horas
  setInterval(runOnce, INTERVAL_MS);
}
