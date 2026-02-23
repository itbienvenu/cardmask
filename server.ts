import CardMasker from "./CONTROLERS/CardMasker.js";
import cardValidator from "card-validator";
import creditCardType from "credit-card-type";

const cardsMask = new CardMasker();


// testing for VISA cards

const visaCards = cardsMask.generateVisaCards(5, 7);

// const res = visaCards.forEach(card => cardValidator.number(card.pan))

// console.log("Cards response is this one : ", visaCards);


const res = cardValidator.number("41396995806864663");

console.log(res.isValid)

// console.log("Totak visacards geerated are: ", visaCards , "\n");