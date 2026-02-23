export type MOCK_CARD_PROVIDER = 'VISA' | 'MASTERCARD' | 'AMEX'

export type CardStatus = "ACTIVE" | "PAUSED" | "BLOCKED" | "EXPIRED"
export type MaskType = "ONE_TIME" | "RECURRING" | "MERCHANT_LOCKED"

export type TransactionStatus = "PENDING" | "SUCCESS" | "DECLINED" | "REFUNDED"

export interface Transaction {
    id: string
    userId: string
    cardId: string // The ID of the mask card used
    amount: number
    currency: string
    merchant: string
    status: TransactionStatus
    timestamp: string
    failureReason?: string | null
}

export interface MaskCard {
    id: string
    pan: string
    cvv: string
    expiryMonth: number
    expiryYear: number
    status: CardStatus
    type: MaskType
    limit_amount: number
    spent_amount: number
    use_cases: string[] // Merchant names or categories
    fundingSourceId: string; // Linked funding source
    createdAt: string
}

export type CardResponse = {
    type: MOCK_CARD_PROVIDER
    pan: string
    cvv: string
    expiryMonth: number
    expiryYear: number
}

export interface FundingSource {
    id: string;
    last4: string;
    network: MOCK_CARD_PROVIDER;
    available_balance: number; // Simulated upstream bank balance
    status: "LINKED" | "UNVERIFIED";
}

export type User = {
    user_id: string;
    names: string;
    phone: string;
    email: string;
    address: string;
    funding_sources: FundingSource[];
    mask_cards: MaskCard[];
    transactions: Transaction[];
}

/**
 * SECURE STORE MODEL: 
 * Handles sensitive tokens separately from the user profile.
 * TODO: In production, this should be stored in an HSM or encrypted-at-rest database.
 */
export interface VaultEntry {
    userId: string;
    vaultToken: string;
}
