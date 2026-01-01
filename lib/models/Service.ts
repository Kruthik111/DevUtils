import mongoose, { Schema, model, models } from 'mongoose';

const ServiceSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        maxLength: 120,
    },
    baseUrls: {
        local: { type: String },
        test: { type: String },
        live: { type: String },
    },
    // legacy fields for backward compatibility
    environment: {
        type: String,
        enum: ['local', 'test', 'live'],
    },
    baseUrl: {
        type: String,
    },
}, {
    timestamps: true,
});

ServiceSchema.index({ userId: 1, name: 1 }, { unique: true });

// Force-refresh model if schema changed (to drop legacy required baseUrl/environment)
delete mongoose.models.Service;
const Service = model('Service', ServiceSchema);

export default Service;

