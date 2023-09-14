import { UserMiniDto } from "../../user/UserDTOs";
import { NadeMiniDto } from "./NadeMiniDto";

export interface UserContributor extends UserMiniDto {
  nadeCount: number;
  totalScore: number;
  score: number;
}

export function getContributors(nades: NadeMiniDto[]): UserMiniDto[] {
  const num = 16;
  const contributors = createContributorsList(nades)
    .map(calculateScore)
    .sort(sortHighestContribution)
    .slice(0, num);

  return contributors.map((c) => ({
    nickname: c.nickname,
    steamId: c.steamId,
    avatar: c.avatar,
    role: c.role,
  }));
}

function createContributorsList(nades: NadeMiniDto[]) {
  const contCount: { [key: string]: UserContributor } = {};

  nades.forEach((nade) => {
    const steamId = nade.user.steamId;
    const currentUser = contCount[steamId];

    if (currentUser) {
      contCount[steamId] = {
        ...currentUser,
        nadeCount: currentUser.nadeCount + 1,
        totalScore: currentUser.totalScore + nade.favoriteCount,
      };
    } else {
      contCount[steamId] = {
        ...nade.user,
        nadeCount: 1,
        score: 0,
        totalScore: nade.favoriteCount,
      };
    }
  });

  return Object.values(contCount);
}

function calculateScore(userContribution: UserContributor): UserContributor {
  const averageEloScore = Math.log(
    userContribution.totalScore / userContribution.nadeCount
  );
  const nadeCountBoost = Math.log(userContribution.nadeCount || 1);

  return {
    ...userContribution,
    score: averageEloScore + nadeCountBoost,
  };
}

function sortHighestContribution(
  userContributionA: UserContributor,
  userContributionB: UserContributor
) {
  return userContributionB.score - userContributionA.score;
}
