// initial controller where we will be generating the cards like for visa when the
// user passed his visa card, and we can use then one of the card to map it to the original one
// this will be done by storing the cards on the database so the we can map the relations
// we will start fot the visa cards
// user will give us the visa card and chooses like he want to get like 5 of masks
// and after the he can choose the price to add to each cards respectively
// first we will create the function and we willbe later mapping it to the account for data consistenc and avoind concpitracr 

import { generateAmexCardNumber } from "../PROVIDERS/amex.js";
import { generateMasterCardNumber } from "../PROVIDERS/mastercard.js";
import { generateVisaCardNumber } from "../PROVIDERS/visa.js";
import type { CardResponse, User, MaskCard, MaskType, Transaction, TransactionStatus, MOCK_CARD_PROVIDER } from "../type.js";
import cardValidator from "card-validator";
import db from "../utils/database.js";
import { v4 as uuidv4 } from "uuid";

class CardMasker {

    maskUserCard(
        user_id: string,
        type: MaskType,
        limit: number,
        originalCardLast4: string,
        useCases: string[] = ["general"],
        network?: MOCK_CARD_PROVIDER
    ): MaskCard | null {
        const user = db.getUser(user_id);
        if (!user) return null;

        if (user.original_card_last4 !== originalCardLast4) {
            console.error("Security Alert: User attempted to mask a card they don't own.");
            return null;
        }

        // Use requested network, or fall back to user's original card network
        const targetNetwork = network || user.original_card_network;
        const newCardData: CardResponse = this.generateCardByNetwork(targetNetwork);

        const mask: MaskCard = {
            id: uuidv4(),
            pan: newCardData.pan,
            cvv: newCardData.cvv,
            expiryMonth: newCardData.expiryMonth,
            expiryYear: newCardData.expiryYear,
            status: "ACTIVE",
            type: type,
            limit_amount: limit,
            spent_amount: 0,
            use_cases: useCases,
            createdAt: new Date().toISOString()
        };

        user.mask_cards.push(mask);
        db.updateUser(user_id, user);
        return mask;
    }

    private generateCardByNetwork(network: MOCK_CARD_PROVIDER): CardResponse {
        switch (network) {
            case 'MASTERCARD':
                return generateMasterCardNumber();
            case 'AMEX':
                return generateAmexCardNumber();
            case 'VISA':
            default:
                return generateVisaCardNumber();
        }
    }

    /**
     * Professional Transaction Engine: Authorize a payment
     */
    authorizePayment(maskPan: string, amount: number, merchant: string): {
        approved: boolean;
        reason?: string;
        userId?: string;
        maskId?: string
    } {
        const users = db.getAllUsers();
        let foundUser: User | null = null;
        let foundMask: MaskCard | null = null;

        for (const user of users) {
            const mask = user.mask_cards.find(m => m.pan === maskPan);
            if (mask) {
                foundUser = user;
                foundMask = mask;
                break;
            }
        }

        if (!foundUser || !foundMask) {
            return { approved: false, reason: "CARD_NOT_FOUND" };
        }

        // 1. Check Status
        if (foundMask.status !== "ACTIVE") {
            return { approved: false, reason: `CARD_${foundMask.status}`, userId: foundUser.user_id, maskId: foundMask.id };
        }

        // 2. Check Limits
        if (foundMask.spent_amount + amount > foundMask.limit_amount) {
            return { approved: false, reason: "INSUFFICIENT_LIMIT", userId: foundUser.user_id, maskId: foundMask.id };
        }

        // 3. Check Merchant Locking
        if (foundMask.type === "MERCHANT_LOCKED") {
            const isAllowed = foundMask.use_cases.some(u =>
                merchant.toLowerCase().includes(u.toLowerCase())
            );
            if (!isAllowed) {
                return { approved: false, reason: "MERCHANT_NOT_AUTHORIZED", userId: foundUser.user_id, maskId: foundMask.id };
            }
        }

        return { approved: true, userId: foundUser.user_id, maskId: foundMask.id };
    }

    /**
     * Finalize and log a transaction
     */
    processTransaction(maskPan: string, amount: number, merchant: string): Transaction {
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

        // Global System Audit
        db.logSystemTransaction(transaction);

        if (auth.userId) {
            const user = db.getUser(auth.userId);
            if (user) {
                if (auth.approved && auth.maskId) {
                    const mask = user.mask_cards.find(m => m.id === auth.maskId);
                    if (mask) {
                        mask.spent_amount += amount;
                        if (mask.type === "ONE_TIME") mask.status = "BLOCKED";
                    }
                }
                user.transactions.push(transaction);
                db.updateUser(user.user_id, user);
            }
        }

        return transaction;
    }

    verifyCard(cardNumber: string): { isValid: boolean; message: string; user?: User; mask?: MaskCard } {
        const validation = cardValidator.number(cardNumber);
        if (!validation.isValid) {
            return { isValid: false, message: "Invalid card format" };
        }

        const users = db.getAllUsers();
        for (const user of users) {
            const mask = user.mask_cards.find(m => m.pan === cardNumber);
            if (mask) {
                return { isValid: true, message: "Valid Mask Card", user, mask };
            }
        }

        return { isValid: false, message: "Card not recognized by CardMask Network" };
    }
}

export default CardMasker;