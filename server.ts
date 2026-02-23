import CardMasker from "./CONTROLERS/CardMasker.js";
import db from "./utils/database.js";
import { v4 as uuidv4 } from "uuid";
import type { User, Transaction } from "./type.js";

const cardsMask = new CardMasker();

// Business Case Simulation
async function runSimulation() {
    // 1. Initialize Business User & Logic (Using stable ID for simulation)
    const DEMO_USER_ID = "d9caf830-8625-414c-bfc0-3edbc5a5bc75";
    let user = db.getUser(DEMO_USER_ID);

    if (!user) {
        user = {
            user_id: DEMO_USER_ID,
            names: "Prosper Nkurunziza",
            phone: "+250788000111",
            email: "prosper@fintech.rw",
            address: "KN 3 Rd, Kigali",
            original_card_last4: "8899",
            original_card_network: "VISA",
            total_balance: 500000, // RWF
            mask_cards: [],
            transactions: []
        };
        await db.addUser(user);
        // SECURE STORE: Storing sensitive token separately
        await db.storeVaultToken(user.user_id, "tok_visa_vault_secure");
        console.log("SUCCESS: Professional Account Provisioned for:", user.names);
    }

    // Safety check for simulation flow
    if (!user) return;

    // 2. Business Use Case: Multi-Network Strategic Masks
    console.log("\n--- PROVISIONING MULTI-NETWORK MASKS ---");
    const netflixMask = await cardsMask.maskUserCard(
        user.user_id,
        "MERCHANT_LOCKED",
        15000,
        "8899",
        ["Netflix"]
    );

    const amexTravelMask = await cardsMask.maskUserCard(
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
        await cardsMask.processTransaction(netflixMask.pan, 12000, "Netflix.com");
    }

    // 4. Unknown Card Audit Demo
    console.log("\n--- SYSTEM AUDIT: UNKNOWN CARD ATTEMPT ---");
    await cardsMask.processTransaction("4111222233334444", 50000, "DarkWeb_Store");

    // 5. Audit Summaries
    console.log("\n--- USER TRANSACTION HISTORY ---");
    const finalizedUser = user ? db.getUser(user.user_id) : null;
    if (finalizedUser) {
        console.table(finalizedUser.transactions.map((t: Transaction) => ({
            Merchant: t.merchant,
            Amount: t.amount,
            Status: t.status
        })));
    }

    console.log("\n--- GLOBAL SYSTEM AUDIT (Including Unknowns) ---");
    console.table(db.getSystemLogs().map((t: Transaction) => ({
        User: t.userId !== "UNKNOWN" ? "SECURE_ID" : "UNKNOWN",
        Card: t.cardId !== "UNKNOWN" ? "SECURE_ID" : "UNKNOWN",
        Merchant: t.merchant,
        Status: t.status,
        Reason: t.failureReason || "-"
    })));
}

runSimulation();