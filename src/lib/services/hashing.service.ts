import { createHash } from "node:crypto";

/**
 * Service for generating consistent hashes of source texts
 */
export class HashingService {
  /**
   * Generate MD5 hash of source text
   * @param text - Source text to hash
   * @returns Hash string in format "md5:hexdigest"
   */
  static generateHash(text: string): string {
    const hash = createHash("md5").update(text, "utf8").digest("hex");
    return `md5:${hash}`;
  }

  /**
   * Verify if a text matches a given hash
   * @param text - Text to verify
   * @param hash - Hash to compare against
   * @returns True if hash matches
   */
  static verifyHash(text: string, hash: string): boolean {
    return this.generateHash(text) === hash;
  }
}
