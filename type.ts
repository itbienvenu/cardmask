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
    createdAt: string
}

export type CardResponse = {
    type: MOCK_CARD_PROVIDER
    pan: string
    cvv: string
    expiryMonth: number
    expiryYear: number
}

export type User = {
    user_id: string;
    names: string;
    phone: string; // Changed to string for international formats
    email: string;
    address: string;
    original_card_last4: string;
    original_card_network: MOCK_CARD_PROVIDER;
    original_card_full_vault_token: string;
    total_balance: number;
    mask_cards: MaskCard[];
    transactions: Transaction[];
}
