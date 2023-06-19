import { NadeDto } from "../dto/NadeDto";

// Function to calculate the Probability
function Probability(rating1: number, rating2: number) {
  return (
    (1.0 * 1.0) / (1 + 1.0 * Math.pow(10, (1.0 * (rating1 - rating2)) / 400))
  );
}

export function eloRating(
  nadeOne: NadeDto,
  nadeTwo: NadeDto,
  winnerId: string,
  K = 40
) {
  let nadeOneNewElo;
  let nadeTwoNewElo;
  const nadeTwoProbability = Probability(nadeOne.eloScore, nadeTwo.eloScore);
  const nadeOneProbability = Probability(nadeTwo.eloScore, nadeOne.eloScore);

  const nadeOneWon = winnerId === nadeOne.id;

  if (nadeOneWon) {
    nadeOneNewElo = nadeOne.eloScore + K * (1 - nadeOneProbability);
    nadeTwoNewElo = nadeTwo.eloScore + K * (0 - nadeTwoProbability);
  } else {
    nadeOneNewElo = nadeOne.eloScore + K * (0 - nadeOneProbability);
    nadeTwoNewElo = nadeTwo.eloScore + K * (1 - nadeTwoProbability);
  }

  return {
    nadeOneNewElo: Math.round(nadeOneNewElo),
    nadeTwoNewElo: Math.round(nadeTwoNewElo),
  };
}
