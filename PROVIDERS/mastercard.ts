// logic for mastercard logic

import type { CardResponse } from "../type.js";
import { calculateLuhnCheckDigit, generateRandomFakeCVV } from "../utils/utils.js";


export function generateMasterCardNumber(): CardResponse {
    let digits: number[] = [5, 1, 2]

    for (let i = 0; i < 12; i++) {
        digits.push(Math.floor(Math.random() * 10))
    }

    const checkDigit = calculateLuhnCheckDigit(digits);
    digits.push(checkDigit);

    return {
        type: 'MASTERCARD',
        pan: digits.join(''),
        cvv: generateRandomFakeCVV(),
        expiryMonth: Math.floor(Math.random() * 12) + 1,
        expiryYear: Math.floor(Math.random() * 10) + 2024
    }
}
