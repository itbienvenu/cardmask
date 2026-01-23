import type { MOCK_CARD_PROVIDER, Card, CardMaskBodyResponse, CardProvider, CardBody, CardResponse } from "./type.js";
import { generateVisaCardNumber } from "./PROVIDERS/visa";
import { generateMasterCardNumber } from "./PROVIDERS/mastercard";
import { generateAmexCardNumber } from "./PROVIDERS/amex";

export function generateCardNumber(provider: MOCK_CARD_PROVIDER): CardResponse {

    if (provider === 'VISA') {
        return generateVisaCardNumber()
    }
    if (provider === 'MASTERCARD') {
        return generateMasterCardNumber()
    }
    if (provider === 'AMEX') {
        return generateAmexCardNumber()

    }
    throw new Error('Provider not found')
}


// testing

console.log("VISA CARD NUMBER", generateCardNumber('VISA'))
console.log("MASTERCARD NUMBER", generateCardNumber('MASTERCARD'))
console.log("AMEX CARD NUMBER", generateCardNumber('AMEX'))
