// initial controller where we will be generating the cards like for visa when the
// user passed his visa card, and we can use then one of the card to map it to the original one
// this will be done by storing the cards on the database so the we can map the relations
// we will start fot the visa cards
// user will give us the visa card and chooses like he want to get like 5 of masks
// and after the he can choose the price to add to each cards respectively
// first we will create the function and we willbe later mapping it to the account for data consistenc and avoind concpitracr 

import { generateAmexCardNumber } from "../PROVIDERS/amex.js";
import { generateMasterCardNumber } from "../PROVIDERS/mastercard.js";
import { generateVisaCardNumber } from "../PROVIDERS/visa.js";
import type { CardResponse } from "../type.js";
import cardValidator from "card-validator";





// SEEDING THE VISA CARD

class CardMasker {
    generateVisaCards(count: number, originalVisaCard: number):CardResponse[] {
        if(!cardValidator.number(originalVisaCard.toString())) return [];

        const cards: CardResponse[] = [];
        for (let i = 0; i < count; i++) {
            cards.push(generateVisaCardNumber());
        }
        return cards;
    }

    generateAmexCards(count: number, originalAmexCard: number): CardResponse[] {
        const cards: CardResponse[] = [];
        for (let i = 0; i < count; i++) {
            cards.push(generateAmexCardNumber());
        }
        return cards;
    }

    generateMasterCards(count: number, originalMasterCard: number): CardResponse[] {
        const cards: CardResponse[] = [];
        for (let i = 0; i < count; i++) {
            cards.push(generateMasterCardNumber());
        }
        return cards;
    }

}

export default CardMasker;