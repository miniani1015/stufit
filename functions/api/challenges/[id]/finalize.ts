type HandlerContext = {
  env: any;
  userId: number;
  params: { id: string };
  request: Request;
};

const getPointRewardByRank = (rank: number) => {
  if (rank <= 1) return 300;
  if (rank === 2) return 200;
  if (rank === 3) return 120;
  return 80;
};

export async function onRequestPost(context: HandlerContext) {
  try {
    const { env, userId, params, request } = context;

    if (!env?.D1_DB) {
      return Response.json({ success: false, message: '데이터베이스 연결 오류' }, { status: 500 });
    }

    if (!userId) {
      return Response.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const challengeId = Number(params.id);
    if (Number.isNaN(challengeId)) {
      return Response.json({ success: false, message: '유효하지 않은 챌린지입니다.' }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const rawBet = Number(body?.betScore ?? 0);
    const betScore = Number.isNaN(rawBet) ? 0 : Math.max(0, Math.floor(rawBet));
    const tieBreakerWinner = Boolean(body?.tieBreakerWinner);

    const isMember = await env.D1_DB
      .prepare('SELECT 1 FROM challenge_members WHERE challenge_id = ? AND user_id = ?')
      .bind(challengeId, userId)
      .first();

    if (!isMember) {
      return Response.json({ success: false, message: '챌린지 참여자만 정산할 수 있습니다.' }, { status: 403 });
    }

    const finalizeReason = `challenge_finalize_points_${challengeId}`;
    const alreadyFinalized = await env.D1_DB
      .prepare('SELECT 1 FROM point_logs WHERE user_id = ? AND reason = ?')
      .bind(userId, finalizeReason)
      .first();

    if (alreadyFinalized) {
      const profile = await env.D1_DB
        .prepare('SELECT points, score FROM user_profiles WHERE user_id = ?')
        .bind(userId)
        .first();

      return Response.json({
        success: true,
        data: {
          alreadyFinalized: true,
          points: Number(profile?.points) || 0,
          score: Number(profile?.score) || 0
        },
        message: '이미 정산이 완료되었습니다.'
      });
    }

    await env.D1_DB
      .prepare(
        `INSERT INTO challenge_results (user_id, challenge_id, score)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, challenge_id) DO UPDATE SET score = excluded.score`
      )
      .bind(userId, challengeId, betScore)
      .run();

    const progressRows = await env.D1_DB
      .prepare(
        `SELECT user_id, COUNT(*) as progress_count
         FROM challenge_daily_progress
         WHERE challenge_id = ?
         GROUP BY user_id
         ORDER BY progress_count DESC, user_id ASC`
      )
      .bind(challengeId)
      .all();

    const ranking = (progressRows?.results || []).map((row: any) => ({
      user_id: Number(row.user_id),
      progress_count: Number(row.progress_count) || 0
    }));

    let rank = 1;
    let prevScore: number | null = null;
    let sameRankCount = 0;
    const ranked = ranking.map((row, idx) => {
      if (idx === 0) {
        rank = 1;
        sameRankCount = 1;
      } else if (row.progress_count === prevScore) {
        sameRankCount += 1;
      } else {
        rank += sameRankCount;
        sameRankCount = 1;
      }
      prevScore = row.progress_count;
      return { ...row, rank };
    });

    const me = ranked.find((r) => r.user_id === userId) || { rank: ranked.length + 1, progress_count: 0 };
    const topScore = ranked.length > 0 ? ranked[0].progress_count : 0;
    const topUsers = ranked.filter((r) => r.progress_count === topScore).map((r) => r.user_id);
    const tieFirst = topUsers.length > 1 && topScore > 0;

    const pointReward = getPointRewardByRank(me.rank);

    await env.D1_DB
      .prepare('UPDATE user_profiles SET points = points + ? WHERE user_id = ?')
      .bind(pointReward, userId)
      .run();

    await env.D1_DB
      .prepare('INSERT INTO point_logs (user_id, point, reason) VALUES (?, ?, ?)')
      .bind(userId, pointReward, finalizeReason)
      .run();

    const betRows = await env.D1_DB
      .prepare('SELECT user_id, score FROM challenge_results WHERE challenge_id = ?')
      .bind(challengeId)
      .all();

    const jackpotTotal = (betRows?.results || []).reduce((sum: number, row: any) => {
      const value = Number(row?.score) || 0;
      return sum + Math.max(0, value);
    }, 0);

    const myBet = Math.max(0, betScore);
    let scoreReward = 0;
    const isSoleFirst = topUsers.length === 1 && topUsers[0] === userId;
    const isTieWinner = tieFirst && topUsers.includes(userId) && tieBreakerWinner;

    if (myBet > 0 && jackpotTotal > 0 && (isSoleFirst || isTieWinner)) {
      scoreReward = jackpotTotal;
      await env.D1_DB
        .prepare('UPDATE user_profiles SET score = score + ? WHERE user_id = ?')
        .bind(scoreReward, userId)
        .run();
    }

    const profile = await env.D1_DB
      .prepare('SELECT points, score FROM user_profiles WHERE user_id = ?')
      .bind(userId)
      .first();

    return Response.json({
      success: true,
      data: {
        rank: me.rank,
        progressCount: me.progress_count,
        pointReward,
        scoreReward,
        tieFirst,
        jackpotTotal,
        betScore: myBet,
        points: Number(profile?.points) || 0,
        score: Number(profile?.score) || 0
      },
      message: '챌린지 종료 정산 완료'
    });
  } catch (err: any) {
    return Response.json(
      { success: false, message: '정산 중 오류가 발생했습니다.', error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
