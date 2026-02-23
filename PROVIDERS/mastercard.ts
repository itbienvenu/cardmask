// logic for mastercard logic

import type { CardResponse } from "../type.js";
import { calculateLuhnCheckDigit, generateRandomFakeCVV } from "../utils/utils.js";


export function generateMasterCardNumber(): CardResponse {
    // Realistic Mastercard BIN: 512106
    let digits: number[] = [5, 1, 2, 1, 0, 6]

    // Total 15 digits before check digit
    for (let i = 0; i < 9; i++) {
        digits.push(Math.floor(Math.random() * 10))
    }

    const checkDigit = calculateLuhnCheckDigit(digits);
    digits.push(checkDigit);

    return {
        type: 'MASTERCARD',
        pan: digits.join(''),
        cvv: generateRandomFakeCVV(),
        expiryMonth: Math.floor(Math.random() * 12) + 1,
        expiryYear: 2029
    }
}
