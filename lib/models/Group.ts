import mongoose, { Schema, model, models } from 'mongoose';

const TabSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    // Notes are stored separately and linked via tabId/groupId, 
    // but we might want to store order here if needed. 
    // For now, we'll just query notes by tabId.
});

const GroupSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    id: { type: String, required: true, unique: true }, // Client-side ID
    name: {
        type: String,
        required: true,
    },
    tabs: [TabSchema],
}, {
    timestamps: true,
});

GroupSchema.index({ userId: 1 });

const Group = models.Group || model('Group', GroupSchema);

export default Group;
