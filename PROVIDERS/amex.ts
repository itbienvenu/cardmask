import type { CardResponse } from "../type.js";
import { calculateLuhnCheckDigit, generateRandomFakeCVV } from "../utils/utils.js";

export function generateAmexCardNumber(): CardResponse {
    // Realistic Amex BIN: 342158
    let digits: number[] = [3, 4, 2, 1, 5, 8]

    // Amex is 15 digits total. Already have 6, need 8 more (total 14) before check digit.
    for (let i = 0; i < 8; i++) {
        digits.push(Math.floor(Math.random() * 10))
    }

    const checkDigit = calculateLuhnCheckDigit(digits);
    digits.push(checkDigit);

    return {
        type: 'AMEX',
        pan: digits.join(''),
        cvv: generateRandomFakeCVV(4), // Amex CVV is 4 digits
        expiryMonth: Math.floor(Math.random() * 12) + 1,
        expiryYear: 2029
    }
}