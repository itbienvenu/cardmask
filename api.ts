import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import CardMasker from "./CONTROLERS/CardMasker.js";
import db from "./utils/database.js";
import { v4 as uuidv4 } from "uuid";
import type { User, MOCK_CARD_PROVIDER, MaskType, FundingSource } from "./type.js";

const app = express();
const port = 3000;
const masker = new CardMasker();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// 1. Get all users (demo purposes)
app.get("/api/users", (req, res) => {
    res.json(db.getAllUsers());
});

// 2. Register a new user + Link initial funding source
app.post("/api/users", async (req, res) => {
    const { names, email, phone, address, originalCardLast4, network } = req.body;

    if (!names || !email || !originalCardLast4) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const userId = uuidv4();
    const initialSource: FundingSource = {
        id: uuidv4(),
        last4: originalCardLast4,
        network: (network as MOCK_CARD_PROVIDER) || "VISA",
        available_balance: 1000000, // Simulated bank balance
        status: "LINKED"
    };

    const newUser: User = {
        user_id: userId,
        names,
        email,
        phone: phone || "",
        address: address || "",
        funding_sources: [initialSource],
        mask_cards: [],
        transactions: []
    };

    await db.addUser(newUser);
    await db.storeVaultToken(newUser.user_id, `tok_vault_${uuidv4()}`);

    res.status(201).json(newUser);
});

// 3. Create a mask card
app.post("/api/users/:id/mask", async (req, res) => {
    const { id } = req.params;
    const { type, limit, fundingSourceId, useCases, network } = req.body;

    const mask = await masker.maskUserCard(
        id,
        type as MaskType,
        Number(limit),
        fundingSourceId,
        useCases,
        network as MOCK_CARD_PROVIDER
    );

    if (!mask) {
        return res.status(400).json({ error: "Failed to create mask. Ensure user exists and funding source is valid." });
    }

    res.json(mask);
});

// 4. Simulate a transaction
app.post("/api/pay", async (req, res) => {
    const { pan, amount, merchant } = req.body;

    if (!pan || !amount || !merchant) {
        return res.status(400).json({ error: "Missing transaction details" });
    }

    const tx = await masker.processTransaction(pan, Number(amount), merchant);
    res.json(tx);
});

// 5. Get system logs
app.get("/api/logs", (req, res) => {
    res.json(db.getSystemLogs());
});

app.listen(port, () => {
    console.log(`🚀 CardMask API (Middle Man Mode) running at http://localhost:${port}`);
});
