import mongoose, { Schema, model, models } from 'mongoose';

const EnvironmentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Environment name is required'],
    },
    variables: {
        type: Schema.Types.Mixed, // { key: value } pairs
        default: {},
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Index for faster queries by user
EnvironmentSchema.index({ userId: 1 });
EnvironmentSchema.index({ userId: 1, isDefault: 1 });

const Environment = models.Environment || model('Environment', EnvironmentSchema);

export default Environment;

