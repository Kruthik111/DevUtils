import mongoose, { Schema, model, models } from 'mongoose';

const ApiConfigSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'API name is required'],
    },
    method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        required: true,
        default: 'GET',
    },
    url: {
        type: String,
        required: [true, 'URL is required'],
    },
    headers: {
        type: Schema.Types.Mixed,
        default: {},
    },
    queryParams: {
        type: Schema.Types.Mixed,
        default: {},
    },
    payload: {
        type: String, // Store as JSON string
        default: '',
    },
    environmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Environment',
    },
    lastOpened: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for faster queries by user
ApiConfigSchema.index({ userId: 1 });
ApiConfigSchema.index({ userId: 1, lastOpened: -1 }); // For sorting by last opened

const ApiConfig = models.ApiConfig || model('ApiConfig', ApiConfigSchema);

export default ApiConfig;

