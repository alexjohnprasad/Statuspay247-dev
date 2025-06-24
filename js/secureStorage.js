/**
 * Secure storage wrapper with encryption for sensitive data
 * Uses Web Crypto API for encryption and sessionStorage for storage
 */
class SecureStorage {
  constructor() {
    this.cryptoKey = null;
    this.initialized = this.init();
  }

  async init() {
    try {
      // Generate or retrieve encryption key
      this.cryptoKey = await this.getCryptoKey();
      return true;
    } catch (error) {
      console.error('SecureStorage init failed:', error);
      return false;
    }
  }

  async getCryptoKey() {
    const keyName = 'statuspay247_crypto_key';
    let key = sessionStorage.getItem(keyName);
    
    if (!key) {
      // Generate new key
      key = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
      sessionStorage.setItem(keyName, key);
    }
    
    return crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(key),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data) {
    await this.initialized;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.cryptoKey,
      encoded
    );
    
    return {
      iv: Array.from(iv).join(','),
      data: Array.from(new Uint8Array(encrypted)).join(',')
    };
  }

  async decrypt(encryptedData) {
    await this.initialized;
    const iv = new Uint8Array(encryptedData.iv.split(',').map(Number));
    const data = new Uint8Array(encryptedData.data.split(',').map(Number));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.cryptoKey,
      data
    );
    
    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  async setItem(key, value) {
    const encrypted = await this.encrypt(value);
    sessionStorage.setItem(key, JSON.stringify(encrypted));
  }

  async getItem(key) {
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;
    
    try {
      return await this.decrypt(JSON.parse(encrypted));
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  removeItem(key) {
    sessionStorage.removeItem(key);
  }

  clear() {
    sessionStorage.clear();
  }
}

// Export singleton instance
const secureStorage = new SecureStorage();
export default secureStorage;
