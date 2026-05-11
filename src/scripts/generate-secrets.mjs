import crypto from 'crypto';

/**
 * Generates secure random keys for production environment variables.
 */

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

console.log('\n🚀 Production Secret Generator\n');
console.log('--------------------------------------------------');
console.log('BETTER_AUTH_SECRET: ', generateSecret(32));
console.log('ENCRYPTION_KEY:     ', generateSecret(32)); // 64 chars hex
console.log('--------------------------------------------------');
console.log('\n⚠️  SAVE THESE IN A SECURE PLACE (like Vercel Environment Variables).');
console.log('❌ NEVER COMMIT THEM TO GIT.\n');
