import express from "express";
import cors from "cors";
import CardMasker from "./CONTROLERS/CardMasker.js";
import db from "./utils/database.js";
import { v4 as uuidv4 } from "uuid";
import type { User, MOCK_CARD_PROVIDER, MaskType, FundingSource, MaskCard } from "./type.js";

const app = express();
const port = 3000;
const masker = new CardMasker();

app.use(cors());
// Replaced bodyParser.json() with built-in express.json()
app.use(express.json());
app.use(express.static("public"));

// Helper for XSS protection (sanitization)
function sanitize(str: string): string {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[m] as string);
}

// Projection helper to return only non-sensitive data
function toPublicUser(user: User) {
    return {
        user_id: user.user_id,
        names: user.names,
        email: user.email,
        funding_sources: user.funding_sources.map(s => ({
            id: s.id,
            last4: s.last4,
            network: s.network,
            availableBalance: s.availableBalance, // In a real app, maybe hide this too
            status: s.status
        })),
        mask_cards: user.mask_cards.map(m => ({
            id: m.id,
            pan: `**** **** **** ${m.pan.slice(-4)}`, // Mask PANs
            status: m.status,
            type: m.type,
            limitAmount: m.limitAmount,
            spentAmount: m.spentAmount,
            useCases: m.useCases,
            createdAt: m.createdAt
        }))
    };
}

// 1. Get all users (sanitized for public view)
app.get("/api/users", (req, res) => {
    const users = db.getAllUsers();
    res.json(users.map(toPublicUser));
});

// 2. Register a new user + Link initial funding source (with sanitization)
app.post("/api/users", async (req, res) => {
    const { names, email, phone, address, originalCardLast4, network } = req.body;

    if (!names || !email || !originalCardLast4 || originalCardLast4.length !== 4) {
        return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    // Sanitize user inputs
    const sanitizedNames = sanitize(names);
    const sanitizedEmail = sanitize(email);
    const sanitizedPhone = sanitize(phone || "");
    const sanitizedAddress = sanitize(address || "");

    const userId = uuidv4();
    const initialSource: FundingSource = {
        id: uuidv4(),
        last4: originalCardLast4,
        network: (["VISA", "MASTERCARD", "AMEX"].includes(network) ? network : "VISA") as MOCK_CARD_PROVIDER,
        availableBalance: 1000000,
        status: "LINKED"
    };

    const newUser: User = {
        user_id: userId,
        names: sanitizedNames,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        address: sanitizedAddress,
        funding_sources: [initialSource],
        mask_cards: [],
        transactions: []
    };

    await db.addUser(newUser);
    await db.storeVaultToken(newUser.user_id, `tok_vault_${uuidv4()}`);

    res.status(201).json(toPublicUser(newUser));
});

// 3. Create a mask card (with validation)
app.post("/api/users/:id/mask", async (req, res) => {
    const { id } = req.params;
    const { type, limit, fundingSourceId, useCases, network } = req.body;

    // Validate MaskType
    const allowedTypes: MaskType[] = ["ONE_TIME", "RECURRING", "MERCHANT_LOCKED"];
    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid Mask type" });
    }

    // Validate fundingSourceId (UUID-like)
    if (!fundingSourceId || fundingSourceId.length < 10) {
        return res.status(400).json({ error: "Invalid funding source ID" });
    }

    const numericLimit = Number(limit);
    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
        return res.status(400).json({ error: "Invalid limit amount" });
    }

    const mask = await masker.maskUserCard(
        id,
        type as MaskType,
        numericLimit,
        fundingSourceId,
        useCases || ["general"],
        network as MOCK_CARD_PROVIDER
    );

    if (!mask) {
        return res.status(400).json({ error: "Failed to create mask. Ensure user exists and funding source is valid." });
    }

    res.json(mask);
});

// 4. Simulate a transaction (with amount validation)
app.post("/api/pay", async (req, res) => {
    const { pan, amount, merchant } = req.body;

    if (!pan || !amount || !merchant) {
        return res.status(400).json({ error: "Missing transaction details" });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    const tx = await masker.processTransaction(pan, numericAmount, sanitize(merchant));
    res.json(tx);
});

// 5. Get system logs
app.get("/api/logs", (req, res) => {
    res.json(db.getSystemLogs());
});

app.listen(port, () => {
    console.log(`🚀 CardMask API (Middle Man Mode) running at http://localhost:${port}`);
});
