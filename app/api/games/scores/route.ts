import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import GameScore, { GAMES, type Game } from "@/lib/models/GameScore";
import { auth } from "@/lib/auth";

const TICTACTOE_POINTS: Record<string, number> = { win: 3, draw: 1, loss: 0 };
const MAX_WPM = 250; // anything above this is not a human

// Monday 00:00 UTC of the current week
function startOfWeek() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

// Tic-tac-toe ranks total points, typing ranks best run
async function topTen(game: Game, since?: Date) {
  return GameScore.aggregate([
    { $match: { game, ...(since && { createdAt: { $gte: since } }) } },
    {
      $group: {
        _id: "$userId",
        score: game === "tictactoe" ? { $sum: "$score" } : { $max: "$score" },
        games: { $sum: 1 },
      },
    },
    { $sort: { score: -1 } },
    { $limit: 10 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        score: 1,
        games: 1,
        name: { $ifNull: [{ $first: "$user.name" }, "Unknown"] },
        image: { $first: "$user.image" },
      },
    },
  ]);
}

export async function GET(request: NextRequest) {
  try {
    const game = request.nextUrl.searchParams.get("game") as Game;
    if (!GAMES.includes(game)) {
      return NextResponse.json({ message: "Invalid game" }, { status: 400 });
    }

    await connectDB();
    const [weekly, overall] = await Promise.all([topTen(game, startOfWeek()), topTen(game)]);

    return NextResponse.json({ weekly, overall });
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { message: "Failed to fetch leaderboard", error: error.message },
      { status: 500 }
    );
  }
}

// ponytail: scores are client-reported and only sanity-checked; server-side game replay if cheating shows up
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let score: number;
    let meta: Record<string, unknown>;

    if (body.game === "tictactoe") {
      if (!(body.result in TICTACTOE_POINTS)) {
        return NextResponse.json({ message: "Invalid result" }, { status: 400 });
      }
      score = TICTACTOE_POINTS[body.result];
      meta = { result: body.result };
    } else if (body.game === "typing") {
      const wpm = Number(body.wpm);
      const accuracy = Number(body.accuracy);
      if (!(wpm >= 0 && wpm <= MAX_WPM && accuracy >= 0 && accuracy <= 100)) {
        return NextResponse.json({ message: "Invalid typing result" }, { status: 400 });
      }
      score = Math.round((wpm * accuracy) / 100);
      meta = { wpm: Math.round(wpm), accuracy: Math.round(accuracy) };
    } else {
      return NextResponse.json({ message: "Invalid game" }, { status: 400 });
    }

    const entry = await GameScore.create({ userId: session.user.id, game: body.game, score, meta });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error("Error saving score:", error);
    return NextResponse.json(
      { message: "Failed to save score", error: error.message },
      { status: 500 }
    );
  }
}
