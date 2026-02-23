export function generateRandomFakeCVV(): string {
    return Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

export function calculateLuhnCheckDigit(partialDigits: number[]): number {
    let sum = 0;
    const reversed = [...partialDigits].reverse();

    for (let i = 0; i < reversed.length; i++) {
        let digit: number | undefined = reversed[i];

        if (digit === undefined) continue;

        if (i % 2 === 0) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
    }

    return (10 - (sum % 10)) % 10;
}