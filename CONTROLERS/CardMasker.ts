import { generateAmexCardNumber } from "../PROVIDERS/amex.js";
import { generateMasterCardNumber } from "../PROVIDERS/mastercard.js";
import { generateVisaCardNumber } from "../PROVIDERS/visa.js";
import type { CardResponse, User, MaskCard, MaskType, Transaction, MOCK_CARD_PROVIDER } from "../type.js";
import cardValidator from "card-validator";
import db from "../utils/database.js";
import { v4 as uuidv4 } from "uuid";

class CardMasker {

    async maskUserCard(
        user_id: string,
        type: MaskType,
        limit: number,
        fundingSourceId: string,
        useCases: string[] = ["general"],
        network?: MOCK_CARD_PROVIDER
    ): Promise<MaskCard | null> {
        const user = db.getUser(user_id);
        if (!user) return null;

        const source = user.funding_sources.find(s => s.id === fundingSourceId);
        if (!source) {
            console.error("Management Error: Funding source not found for this user.");
            return null;
        }

        // Use requested network, or fall back to the funding source network
        const targetNetwork = network || source.network;
        const newCardData: CardResponse = this.generateCardByNetwork(targetNetwork);

        const mask: MaskCard = {
            id: uuidv4(),
            pan: newCardData.pan,
            cvv: newCardData.cvv,
            expiryMonth: newCardData.expiryMonth,
            expiryYear: newCardData.expiryYear,
            status: "ACTIVE",
            type: type,
            limitAmount: limit,
            spentAmount: 0,
            useCases: useCases,
            fundingSourceId: fundingSourceId,
            createdAt: new Date().toISOString()
        };

        user.mask_cards.push(mask);
        await db.updateUser(user_id, user);
        return mask;
    }

    private generateCardByNetwork(network: MOCK_CARD_PROVIDER): CardResponse {
        switch (network) {
            case 'MASTERCARD':
                return generateMasterCardNumber();
            case 'AMEX':
                return generateAmexCardNumber();
            case 'VISA':
                return generateVisaCardNumber();
            default:
                // Detect unknown network values and throw/log error
                console.error(`Unsupported card network: ${network}`);
                throw new Error(`Unsupported card network: ${network}`);
        }
    }

    /**
     * Professional Transaction Engine: Authorize a payment
     */
    authorizePayment(maskPan: string, amount: number, merchant: string): {
        approved: boolean;
        reason?: string;
        userId?: string;
        maskId?: string;
        sourceId?: string;
    } {
        if (!Number.isFinite(amount) || amount <= 0) {
            return { approved: false, reason: "INVALID_AMOUNT" };
        }

        const lookup = db.lookupByPan(maskPan);
        if (!lookup) {
            return { approved: false, reason: "CARD_NOT_FOUND" };
        }

        const foundUser = lookup.user;
        const foundMask = lookup.mask;

        // Missing null-check guard for user/mask
        if (!foundUser || !foundMask) {
            return { approved: false, reason: "CARD_NOT_FOUND" };
        }

        // 1. Check Mask Status
        if (foundMask.status !== "ACTIVE") {
            return { approved: false, reason: `CARD_${foundMask.status}`, userId: foundUser.user_id, maskId: foundMask.id };
        }

        // 2. Check Virtual Card Limits
        if (foundMask.spentAmount + amount > foundMask.limitAmount) {
            return { approved: false, reason: "INSUFFICIENT_LIMIT", userId: foundUser.user_id, maskId: foundMask.id };
        }

        // 3. Middle Man Check: Verify Funding Source (Real Bank Account)
        const source = foundUser.funding_sources.find(s => s.id === foundMask.fundingSourceId);
        if (!source || source.availableBalance < amount) {
            return { approved: false, reason: "INSUFFICIENT_FUNDS_AT_SOURCE", userId: foundUser.user_id, maskId: foundMask.id };
        }

        // 4. Check Merchant Locking
        if (foundMask.type === "MERCHANT_LOCKED") {
            const isAllowed = foundMask.useCases.some(u =>
                merchant.toLowerCase().includes(u.toLowerCase())
            );
            if (!isAllowed) {
                return { approved: false, reason: "MERCHANT_NOT_AUTHORIZED", userId: foundUser.user_id, maskId: foundMask.id };
            }
        }

        return { approved: true, userId: foundUser.user_id, maskId: foundMask.id, sourceId: source.id };
    }

    /**
     * Finalize and log a transaction
     */
    async processTransaction(maskPan: string, amount: number, merchant: string): Promise<Transaction> {
        // Validation: reject bad input at the logic boundary too
        if (!Number.isFinite(amount) || amount <= 0) {
            const tx: Transaction = {
                id: uuidv4(),
                userId: "UNKNOWN",
                cardId: "UNKNOWN",
                amount,
                currency: "RWF",
                merchant,
                status: "DECLINED",
                timestamp: new Date().toISOString(),
                failureReason: "INVALID_AMOUNT"
            };
            await db.logSystemTransaction(tx);
            return tx;
        }

        const auth = this.authorizePayment(maskPan, amount, merchant);
        const timestamp = new Date().toISOString();
        const txId = uuidv4();

        const transaction: Transaction = {
            id: txId,
            userId: auth.userId || "UNKNOWN",
            cardId: auth.maskId || "UNKNOWN",
            amount,
            currency: "RWF",
            merchant,
            status: auth.approved ? "SUCCESS" : "DECLINED",
            timestamp,
            failureReason: auth.reason ?? null
        };

        if (auth.userId) {
            const user = db.getUser(auth.userId);
            if (user) {
                if (auth.approved && auth.maskId && auth.sourceId) {
                    const mask = user.mask_cards.find(m => m.id === auth.maskId);
                    const source = user.funding_sources.find(s => s.id === auth.sourceId);

                    // TOCTOU Protection: Re-validate conditions on freshly-fetched user
                    if (!mask || mask.status !== "ACTIVE") {
                        transaction.status = "DECLINED";
                        transaction.failureReason = "CARD_STATE_CHANGED";
                    } else if (mask.spentAmount + amount > mask.limitAmount) {
                        transaction.status = "DECLINED";
                        transaction.failureReason = "INSUFFICIENT_LIMIT";
                    } else if (!source || source.availableBalance < amount) {
                        transaction.status = "DECLINED";
                        transaction.failureReason = "INSUFFICIENT_FUNDS_AT_SOURCE";
                    } else {
                        // MIDDLE MAN ACTION: Pull funds from real account, track virtual spending
                        source.availableBalance -= amount;
                        mask.spentAmount += amount;
                        if (mask.type === "ONE_TIME") mask.status = "BLOCKED";
                    }
                }
                user.transactions.push(transaction);
                await db.updateUser(user.user_id, user);
            }
        }

        await db.logSystemTransaction(transaction);
        return transaction;
    }

    verifyCard(cardNumber: string): { isValid: boolean; message: string; user?: User; mask?: MaskCard } {
        const validation = cardValidator.number(cardNumber);
        if (!validation.isValid) {
            return { isValid: false, message: "Invalid card format" };
        }

        const lookup = db.lookupByPan(cardNumber);
        if (lookup) {
            return { isValid: true, message: "Valid Mask Card", user: lookup.user, mask: lookup.mask };
        }

        return { isValid: false, message: "Card not recognized by CardMask Network" };
    }
}

export default CardMasker;