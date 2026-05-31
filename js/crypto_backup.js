// Passphrase-based encryption for the portable backup file.
//
// The app is offline with no backend, but the learner swaps phones (Samsung ↔
// iPhone) and wants their learning history kept "very secure". The answer that
// fits an offline PWA is a strongly-encrypted, keyless backup file the user
// moves between devices themselves (AirDrop / email / cloud). Nothing leaves the
// device unencrypted and no key is ever stored.
//
// Scheme (all via the platform WebCrypto, no third-party libs):
//   passphrase --PBKDF2(SHA-256, 150k iters, random salt)--> AES-GCM 256 key
//   plaintext  --AES-GCM(random 12-byte IV)--> ciphertext (+ built-in auth tag)
// A wrong passphrase (or any tampering) fails the GCM auth tag, so decryption
// throws rather than returning partial/garbage data.
const CryptoBackup = (() => {
  const ENVELOPE_VERSION = 1;
  const KDF_ITERATIONS = 150000;
  const SALT_BYTES = 16;
  const IV_BYTES = 12;
  const APP_TAG = "ru_en_trainer";

  function subtle() {
    return (typeof crypto !== "undefined" && crypto.subtle) ? crypto.subtle : null;
  }

  function available() {
    return !!subtle()
      && typeof crypto.getRandomValues === "function"
      && typeof TextEncoder !== "undefined"
      && typeof TextDecoder !== "undefined"
      && typeof btoa === "function"
      && typeof atob === "function";
  }

  function toBase64(buffer) {
    const arr = new Uint8Array(buffer);
    let bin = "";
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    return btoa(bin);
  }

  function fromBase64(b64) {
    const bin = atob(String(b64));
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  async function deriveKey(passphrase, salt, iterations) {
    const baseKey = await subtle().importKey(
      "raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]
    );
    return subtle().deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encrypt(plaintext, passphrase) {
    if (!available()) throw new Error("crypto_unavailable");
    if (!passphrase) throw new Error("passphrase_required");
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(passphrase, salt, KDF_ITERATIONS);
    const ct = await subtle().encrypt(
      { name: "AES-GCM", iv }, key, new TextEncoder().encode(String(plaintext))
    );
    return JSON.stringify({
      app: APP_TAG,
      enc: "AES-GCM",
      v: ENVELOPE_VERSION,
      kdf: "PBKDF2-SHA256",
      iter: KDF_ITERATIONS,
      salt: toBase64(salt),
      iv: toBase64(iv),
      ct: toBase64(ct),
    }, null, 2);
  }

  // True when `text` looks like one of our encrypted envelopes (vs. plain JSON
  // backup), so import can decide whether to ask for a passphrase.
  function isEnvelope(text) {
    try {
      const o = JSON.parse(text);
      return !!o && o.enc === "AES-GCM"
        && typeof o.ct === "string"
        && typeof o.salt === "string"
        && typeof o.iv === "string";
    } catch {
      return false;
    }
  }

  async function decrypt(envelopeText, passphrase) {
    if (!available()) throw new Error("crypto_unavailable");
    if (!passphrase) throw new Error("passphrase_required");
    let o;
    try { o = JSON.parse(envelopeText); } catch { throw new Error("bad_envelope"); }
    if (!o || o.enc !== "AES-GCM" || !o.salt || !o.iv || !o.ct) throw new Error("bad_envelope");
    const iterations = Math.max(1, parseInt(o.iter, 10) || KDF_ITERATIONS);
    const key = await deriveKey(passphrase, fromBase64(o.salt), iterations);
    let plainBuf;
    try {
      plainBuf = await subtle().decrypt(
        { name: "AES-GCM", iv: fromBase64(o.iv) }, key, fromBase64(o.ct)
      );
    } catch {
      // GCM auth-tag failure: wrong passphrase or a tampered/corrupt file.
      throw new Error("decrypt_failed");
    }
    return new TextDecoder().decode(plainBuf);
  }

  return { available, encrypt, decrypt, isEnvelope, ENVELOPE_VERSION };
})();

if (typeof module !== "undefined" && module.exports) module.exports = CryptoBackup;
if (typeof globalThis !== "undefined") globalThis.CryptoBackup = CryptoBackup;
