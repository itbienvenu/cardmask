
export type MOCK_CARD_PROVIDER = 'VISA' | 'MASTERCARD' | 'AMEX'

export type Card = {
    id: string
    pan: string // primary account number
    expiryMonth: number
    expiryYear: number
    cvv: string
    status: CardStatus
    limitAmount: number
    spentAmount: number
    allowedMerchants: string[]
    oneTimeUse: boolean
    createdAt: Date
}

export type CardStatus = "ACTIVE" | "EXPIRED" | "BLOCKED"

export type CardBody = {
    pan: string
    cvv: string
    expiryMonth: number
    expiryYear: number
}

export type CardResponse = {
    type: MOCK_CARD_PROVIDER
    pan: string
    cvv: string
    expiryMonth: number
    expiryYear: number
}

export type CardMaskBodyResponse = {
    parentCardId: string
    pan: string
    cvv: string
    expiryMonth: number
    expiryYear: number
}


export type CardProvider = {
    name: MOCK_CARD_PROVIDER
}