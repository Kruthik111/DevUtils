import { Schema, model, models } from 'mongoose';

export const GAMES = ['tictactoe', 'typing'] as const;
export type Game = (typeof GAMES)[number];

const GameScoreSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    game: {
        type: String,
        enum: GAMES,
        required: true,
    },
    score: {
        type: Number,
        required: true,
        min: 0,
    },
    // Extra per-game info, e.g. { wpm, accuracy } or { result }
    meta: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

GameScoreSchema.index({ game: 1, createdAt: -1 });

const GameScore = models?.GameScore || model('GameScore', GameScoreSchema);

export default GameScore;
