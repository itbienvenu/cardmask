import CardMasker from "./CONTROLERS/CardMasker.js";
import db from "./utils/database.js";
import { v4 as uuidv4 } from "uuid";
import type { User, Transaction } from "./type.js";

const cardsMask = new CardMasker();

// 1. Initialize Business User
let user: User | undefined = db.getAllUsers()[0];
if (!user) {
    const newUser: User = {
        user_id: uuidv4(),
        names: "Prosper Nkurunziza",
        phone: "+250788000111",
        email: "prosper@fintech.rw",
        address: "KN 3 Rd, Kigali",
        original_card_last4: "8899",
        original_card_full_vault_token: "tok_visa_vault", // Simulation of secure storage
        total_balance: 500000, // RWF
        mask_cards: [],
        transactions: []
    };
    db.addUser(newUser);
    user = newUser;
    console.log("SUCCESS: Professional Account Provisioned for:", user.names);
}

// 2. Business Use Case: Generating Strategic Masks
console.log("\n--- PROVISIONING STRATEGIC MASKS ---");
const netflixMask = cardsMask.maskUserCard(
    user.user_id,
    "MERCHANT_LOCKED",
    15000,
    "8899",
    ["Netflix"]
);

const shadyStoreMask = cardsMask.maskUserCard(
    user.user_id,
    "ONE_TIME",
    5000,
    "8899",
    ["ShadyStore"]
);

if (netflixMask) {
    console.log(`[SUBSCRIPTION MASK] Created for Netflix: ${netflixMask.pan} (Limit: ${netflixMask.limit_amount} RWF)`);
}

// 3. Simulation: Processing Transactions
console.log("\n--- PROCESSING REAL-TIME TRANSACTIONS ---");

if (netflixMask) {
    // Attempting a valid Netflix payment
    const tx1 = cardsMask.processTransaction(netflixMask.pan, 12000, "Netflix.com / Dublin");
    console.log(`[TXN ${tx1.status}] ${tx1.amount} RWF at ${tx1.merchant}`);

    // Attempting an unauthorized merchant with the same locked card
    const tx2 = cardsMask.processTransaction(netflixMask.pan, 500, "Unknown_Hacker_Store");
    console.log(`[TXN ${tx2.status}] 500 RWF at ${tx2.merchant} (Reason: ${tx2.failureReason})`);
}

if (shadyStoreMask) {
    // Valid one-time use
    const tx3 = cardsMask.processTransaction(shadyStoreMask.pan, 2000, "ShadyStore.com");
    console.log(`[TXN ${tx3.status}] 2000 RWF at ${tx3.merchant}`);

    // Second attempt on the ONE_TIME card (should fail as it's now BLOCKED)
    const tx4 = cardsMask.processTransaction(shadyStoreMask.pan, 1000, "ShadyStore.com");
    console.log(`[TXN ${tx4.status}] 1000 RWF attempt (Reason: ${tx4.failureReason})`);
}

// 4. Audit Trail Summary
console.log("\n--- BUSINESS AUDIT TRAIL ---");
const finalizedUser = db.getUser(user.user_id);
if (finalizedUser) {
    console.table(finalizedUser.transactions.map((t: Transaction) => ({
        Time: new Date(t.timestamp).toLocaleTimeString(),
        Merchant: t.merchant,
        Amount: t.amount,
        Status: t.status,
        Reason: t.failureReason || "-"
    })));
}