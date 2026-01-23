import type { CardResponse } from "../type.js";
import { calculateLuhnCheckDigit, generateRandomFakeCVV } from "../utils.js";

export function generateAmexCardNumber(): CardResponse {
    let digits: number[] = [3, 4]

    for (let i = 0; i < 12; i++) {
        digits.push(Math.floor(Math.random() * 10))
    }

    const checkDigit = calculateLuhnCheckDigit(digits);
    digits.push(checkDigit);

    return {
        type: 'AMEX',
        pan: digits.join(''),
        cvv: generateRandomFakeCVV(),
        expiryMonth: 0,
        expiryYear: 0
    }
}