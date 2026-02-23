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
        original_card_network: "VISA",
        original_card_full_vault_token: "tok_visa_vault_secure", // Simulation
        total_balance: 500000, // RWF
        mask_cards: [],
        transactions: []
    };
    db.addUser(newUser);
    user = newUser;
    console.log("SUCCESS: Professional Account Provisioned for:", user.names);
}

// 2. Business Use Case: Multi-Network Strategic Masks
console.log("\n--- PROVISIONING MULTI-NETWORK MASKS ---");
const netflixMask = cardsMask.maskUserCard(
    user.user_id,
    "MERCHANT_LOCKED",
    15000,
    "8899",
    ["Netflix"]
);

const amexTravelMask = cardsMask.maskUserCard(
    user.user_id,
    "RECURRING",
    100000,
    "8899",
    ["Travel", "AirRwanda"],
    "AMEX"
);

if (netflixMask) console.log(`[VISA MASK] Netflix: ${netflixMask.pan}`);
if (amexTravelMask) console.log(`[AMEX MASK] Travel: ${amexTravelMask.pan}`);

// 3. Transactions & Audit
console.log("\n--- PROCESSING REAL-TIME TRANSACTIONS ---");

if (netflixMask) {
    cardsMask.processTransaction(netflixMask.pan, 12000, "Netflix.com");
}

// 4. Unknown Card Audit Demo
console.log("\n--- SYSTEM AUDIT: UNKNOWN CARD ATTEMPT ---");
cardsMask.processTransaction("4111222233334444", 50000, "DarkWeb_Store");

// 5. Audit Summaries
console.log("\n--- USER TRANSACTION HISTORY ---");
const finalizedUser = db.getUser(user.user_id);
if (finalizedUser) {
    console.table(finalizedUser.transactions.map((t: Transaction) => ({
        Merchant: t.merchant,
        Amount: t.amount,
        Status: t.status
    })));
}

console.log("\n--- GLOBAL SYSTEM AUDIT (Including Unknowns) ---");
console.table(db.getSystemLogs().map((t: Transaction) => ({
    User: t.userId,
    Card: t.cardId,
    Merchant: t.merchant,
    Status: t.status,
    Reason: t.failureReason || "-"
})));