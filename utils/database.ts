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

import type { User } from "../type.js";
import fs from "node:fs";


class Database {
   private users: User[] = [];
   private readonly dbPath = new URL('./database.json', import.meta.url).pathname;

   constructor() {
      this.load();
   }

   private load() {
      try {
         if (fs.existsSync(this.dbPath)) {
            const data = fs.readFileSync(this.dbPath, "utf-8");
            this.users = JSON.parse(data);
         } else {
            this.users = [];
         }
      } catch (error) {
         console.error("Error loading database:", error);
         this.users = [];
      }
   }

   private save() {
      try {
         fs.writeFileSync(this.dbPath, JSON.stringify(this.users, null, 2));
      } catch (error) {
         console.error("Error saving database:", error);
      }
   }

   addUser(user: User) {
      this.users.push(user);
      this.save();
   }

   getUser(user_id: string) {
      return this.users.find(user => user.user_id === user_id);
   }

   deleteUser(user_id: string) {
      this.users = this.users.filter(user => user.user_id !== user_id);
      this.save();
   }

   updateUser(user_id: string, updatedUser: User) {
      this.users = this.users.map(user => user.user_id === user_id ? updatedUser : user);
      this.save();
   }

   getAllUsers() {
      return this.users;
   }
}

export default new Database();