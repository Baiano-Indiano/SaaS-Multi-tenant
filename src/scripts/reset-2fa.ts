import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, twoFactors } from "../lib/db/schema";
import * as dotenv from "dotenv";
import path from "path";

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada no .env.local");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function resetAll2FA() {
  console.log("🚀 Conectando ao banco e resetando todos os 2FAs...");
  
  try {
    // 1. Desativar a flag de 2FA em todos os usuários
    await db.update(users).set({ twoFactorEnabled: false });
    
    // 2. Remover os registros de segredos TOTP
    await db.delete(twoFactors);
    
    console.log("✅ 2FA resetado com sucesso! Agora você pode logar normalmente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao resetar 2FA:", error);
    process.exit(1);
  }
}

resetAll2FA();
