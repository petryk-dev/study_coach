// Throwaway script: npx tsx test-groq.ts
import 'dotenv/config';
import { generateCards, generateSummary } from './src/services/cardGen';

const notes = `Photosynthesis is the process by which green plants use sunlight,
water, and carbon dioxide to produce glucose and oxygen. It takes place mainly in the
chloroplasts, which contain the pigment chlorophyll. The light-dependent reactions
occur in the thylakoid membranes, while the Calvin cycle occurs in the stroma.`;

(async () => {
  const [cards, summary] = [await generateCards(notes), await generateSummary(notes)];

  console.log('SUMMARY:\n' + summary);
  console.log(`\nCARDS (${cards.length}):`);
  cards.forEach((card, i) => console.log(`\n#${i + 1} Q: ${card.front}\n   A: ${card.back}`));
})().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
