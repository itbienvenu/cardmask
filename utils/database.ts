// this willbe a mockup databse to store the users for debugging the relationships in dev mode

/*
[
{
 
 user_id : "uuid",
 card_type: string,
 names: string,
 phone: number,
 email: string,
 address: string,
 original_card: number,
 total_amount: double // we will start with 0
 siblings:[
    { id: 1, card_number: number, amount: double, use_case: strings[]},
    { id: 2, card_number: number, amount: double, use_case: strings[]},
    { id: 3, card_number: number, amount: double, use_case: strings[]},
    { id: 4, card_number: number, amount: double, use_case: strings[]},
    { id: 5, card_number: number, amount: double, use_case: strings[]},

 ]
 
},


{
 
 user_id : "uuid",
 card_type: string,
 names: string,
 phone: number,
 email: string,
 address: string,
 original_card: number,
 total_amount: double
 siblings:[
    { id: 1, card_number: number, amount: double, use_case: strings[]},
    { id: 2, card_number: number, amount: double, use_case: strings[]},
    { id: 3, card_number: number, amount: double, use_case: strings[]},
    { id: 4, card_number: number, amount: double, use_case: strings[]},
    { id: 5, card_number: number, amount: double, use_case: strings[]},

 ]
 
},



]
*/

import type { User, Transaction } from "../type.js";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

class Database {
   private users: User[] = [];
   private systemTransactions: Transaction[] = [];
   private readonly dbPath = fileURLToPath(new URL("./database.json", import.meta.url));
   private readonly logPath = fileURLToPath(new URL("./system_audit.json", import.meta.url));

   constructor() {
      // We can't use async in constructor, so we load initial state
      // In a real app, you might have an 'init' method
      this.loadSync();
   }

   private loadSync() {
      try {
         if (existsSync(this.dbPath)) {
            const data = readFileSync(this.dbPath, "utf-8");
            this.users = JSON.parse(data);
         }
         if (existsSync(this.logPath)) {
            const data = readFileSync(this.logPath, "utf-8");
            this.systemTransactions = JSON.parse(data);
         }
      } catch (error) {
         console.error("Error loading database:", error);
      }
   }

   private async save() {
      try {
         // Security: In a real app, we would encrypt 'users' before writing
         await fs.writeFile(this.dbPath, JSON.stringify(this.users, null, 2));
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

   async addUser(user: User) {
      this.users.push(user);
      await this.save();
   }

   getUser(user_id: string) {
      return this.users.find(user => user.user_id === user_id);
   }

   async deleteUser(user_id: string) {
      this.users = this.users.filter(user => user.user_id !== user_id);
      await this.save();
   }

   async updateUser(user_id: string, updatedUser: User) {
      this.users = this.users.map(user => user.user_id === user_id ? updatedUser : user);
      await this.save();
   }

   getAllUsers() {
      return this.users;
   }

   async logSystemTransaction(transaction: Transaction) {
      this.systemTransactions.push(transaction);
      await this.saveLogs();
   }

   getSystemLogs() {
      return this.systemTransactions;
   }
}

export default new Database();