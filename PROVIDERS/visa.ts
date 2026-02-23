import type { CardResponse } from "../type.js";
import { calculateLuhnCheckDigit, generateRandomFakeCVV } from "../utils/utils.js";

export function generateVisaCardNumber(): CardResponse {
    // Realistic Chase Bank BIN: 414720
    let digits: number[] = [4, 1, 4, 7, 2, 0];

    // Generate remaining 9 digits (total 15 before check digit)
    for (let i = 0; i < 9; i++) {
        digits.push(Math.floor(Math.random() * 10));
    }

    const checkDigit = calculateLuhnCheckDigit(digits);
    digits.push(checkDigit);

    return {
        type: 'VISA',
        pan: digits.join(''),
        cvv: generateRandomFakeCVV(),
        expiryMonth: Math.floor(Math.random() * 12) + 1,
        expiryYear: 2029 // Static realistic future year for demo
    };
}
