// Throwaway script: node test-groq.js
require('dotenv').config();
const { chatJSON } = require('./src/services/groq');

const paragraph = `Photosynthesis is the process by which green plants use sunlight,
water, and carbon dioxide to produce glucose and oxygen. It takes place mainly in the
chloroplasts, which contain the pigment chlorophyll. The light-dependent reactions
occur in the thylakoid membranes, while the Calvin cycle occurs in the stroma.`;

(async () => {
  const result = await chatJSON({
    system:
      'You are a study coach. Create flashcards from the given text. ' +
      'Respond only with JSON in the shape {"flashcards":[{"question":"...","answer":"..."}]}.',
    user: paragraph,
  });

  result.flashcards.forEach((card, i) => {
    console.log(`\n#${i + 1} Q: ${card.question}\n   A: ${card.answer}`);
  });
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
