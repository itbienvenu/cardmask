import type { CardResponse } from "../type.js";
import { calculateLuhnCheckDigit, generateRandomFakeCVV } from "../utils/utils.js";

export function generateAmexCardNumber(): CardResponse {
    let digits: number[] = [3, 4, 2, 1, 5, 8]

    for (let i = 0; i < 8; i++) {
        digits.push(Math.floor(Math.random() * 10))
    }

    const checkDigit = calculateLuhnCheckDigit(digits);
    digits.push(checkDigit);

    return {
        type: 'AMEX',
        pan: digits.join(''),
        cvv: generateRandomFakeCVV(4),
        expiryMonth: Math.floor(Math.random() * 12) + 1,
        expiryYear: 2029
    }
}