// features/autoBackup.js
import fs from "fs";

/**
 * Envía automáticamente un backup de los archivos JSON cada 6 horas
 * al ADMIN_ID_1 (y si quieres, también a ADMIN_ID_2).
 */
export function autoBackup(client, config) {
  setInterval(async () => {
    try {
      const adminIds = [process.env.ADMIN_ID_1, process.env.ADMIN_ID_2].filter(Boolean);

      for (const adminId of adminIds) {
        const user = await client.users.fetch(adminId).catch(() => null);
        if (!user) continue;

        const archivos = [
          "xp.json",
          "parejas.json",
          "amistades.json",
          "claimCooldowns.json",
          "registros.json"
        ].filter(file => fs.existsSync(`./${file}`));

        if (archivos.length > 0) {
          await user.send({
            content: "📦 Backup automático (cada 6 horas):",
            files: archivos.map(file => ({
              attachment: `./${file}`,
              name: file
            }))
          });
          console.log(`✅ Backup automático enviado a ${user.tag}`);
        }
      }
    } catch (err) {
      console.error("❌ Error en autoBackup:", err);
    }
  }, 6 * 60 * 60 * 1000); // cada 6 horas
}
