import mongoose, { Schema, model, models } from 'mongoose';

const DbCheckSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        maxLength: 120,
    },
    endpoint: {
        type: String,
        required: true,
    },
    token: {
        type: String,
    },
    paramsTemplate: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

DbCheckSchema.index({ userId: 1, title: 1 }, { unique: true });

const DbCheck = models.DbCheck || model('DbCheck', DbCheckSchema);

export default DbCheck;

