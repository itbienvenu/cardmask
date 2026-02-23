import type { User, Transaction, MaskCard, VaultEntry } from "../type.js";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

class Database {
   private users: User[] = [];
   private systemTransactions: Transaction[] = [];
   private panIndex: Map<string, { userId: string; maskId: string }> = new Map();
   private vault: Map<string, string> = new Map(); // userId -> vaultToken

   private readonly dbPath = fileURLToPath(new URL("./database.json", import.meta.url));
   private readonly logPath = fileURLToPath(new URL("./system_audit.json", import.meta.url));
   private readonly vaultPath = fileURLToPath(new URL("./vault.json", import.meta.url));

   constructor() {
      // We can't use async in constructor, so we load initial state
      this.loadSync();
   }

   private loadSync() {
      try {
         if (existsSync(this.dbPath)) {
            const data = readFileSync(this.dbPath, "utf-8");
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
               this.users = parsed;
               this.rebuildIndex();
            }
         }
         if (existsSync(this.logPath)) {
            const data = readFileSync(this.logPath, "utf-8");
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
               this.systemTransactions = parsed;
            }
         }
         // Load secure vault tokens
         if (existsSync(this.vaultPath)) {
            const data = readFileSync(this.vaultPath, "utf-8");
            const parsed: VaultEntry[] = JSON.parse(data);
            this.vault = new Map(parsed.map(v => [v.userId, v.vaultToken]));
         }
      } catch (error) {
         console.error(`Error loading database files:`, error);
         this.users = [];
         this.systemTransactions = [];
      }
   }

   private rebuildIndex() {
      this.panIndex.clear();
      for (const user of this.users) {
         for (const mask of user.mask_cards) {
            this.panIndex.set(mask.pan, { userId: user.user_id, maskId: mask.id });
         }
      }
   }

   private async save() {
      try {
         await fs.writeFile(this.dbPath, JSON.stringify(this.users, null, 2));
         this.rebuildIndex();
      } catch (error) {
         console.error("Error saving database:", error);
      }
   }

   private async saveLogs() {
      try {
         await fs.writeFile(this.logPath, JSON.stringify(this.systemTransactions, null, 2));
      } catch (error) {
         console.error("Error saving system logs:", error);
      }
   }

   private async saveVault() {
      try {
         const data: VaultEntry[] = Array.from(this.vault.entries()).map(([userId, vaultToken]) => ({
            userId,
            vaultToken
         }));
         // TODO: Apply AES-256 encryption-at-rest before saving here
         await fs.writeFile(this.vaultPath, JSON.stringify(data, null, 2));
      } catch (error) {
         console.error("Error saving vault:", error);
      }
   }

   async addUser(user: User) {
      const exists = this.getUser(user.user_id);
      if (exists) return;
      this.users.push(user);
      await this.save();
   }

   getUser(user_id: string) {
      return this.users.find(user => user.user_id === user_id);
   }

   lookupByPan(pan: string): { user: User; mask: MaskCard } | null {
      const entry = this.panIndex.get(pan);
      if (!entry) return null;
      const user = this.getUser(entry.userId);
      if (!user) return null;
      const mask = user.mask_cards.find(m => m.id === entry.maskId);
      if (!mask) return null;
      return { user, mask };
   }

   async deleteUser(user_id: string) {
      this.users = this.users.filter(user => user.user_id !== user_id);
      this.vault.delete(user_id);
      await this.save();
      await this.saveVault();
   }

   async updateUser(user_id: string, updatedUser: User) {
      this.users = this.users.map(user => user.user_id === user_id ? updatedUser : user);
      await this.save();
   }

   // --- SECURE VAULT ACCESSORS ---
   async storeVaultToken(userId: string, token: string) {
      this.vault.set(userId, token);
      await this.saveVault();
   }

   getVaultToken(userId: string) {
      return this.vault.get(userId);
   }

   getAllUsers(): User[] {
      return JSON.parse(JSON.stringify(this.users));
   }

   async logSystemTransaction(transaction: Transaction) {
      this.systemTransactions.push(transaction);
      await this.saveLogs();
   }

   getSystemLogs(): Transaction[] {
      return JSON.parse(JSON.stringify(this.systemTransactions));
   }
}

export default new Database();