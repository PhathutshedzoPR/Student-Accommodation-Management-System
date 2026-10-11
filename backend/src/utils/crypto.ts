import crypto from 'crypto';

// Visitor ID/passport numbers are sensitive, so they're encrypted at rest
// (see schema.prisma: visitors.id_number). Security staff only ever see the
// decrypted value through the check-in endpoint response, never in a list.
const PASSPHRASE = process.env.ENCRYPTION_KEY ?? 'dev-only-insecure-passphrase';
const SALT = 'student-accommodation-fixed-salt'; // fine for a derived symmetric key
const KEY = crypto.scryptSync(PASSPHRASE, SALT, 32);
const IV_LENGTH = 16;

export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(cipherText: string): string {
  const [ivHex, dataHex] = cipherText.split(':');
  if (!ivHex || !dataHex) return cipherText; // not encrypted (e.g. legacy/seed data)
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
