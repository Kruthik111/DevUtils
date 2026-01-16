import mongoose, { Schema, model, models } from 'mongoose';

const NotificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        maxLength: [200, 'Title should be less than 200 characters'],
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        maxLength: [500, 'Message should be less than 500 characters'],
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'user_signup'],
        default: 'info',
    },
    read: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

// Index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = models?.Notification || model('Notification', NotificationSchema);

export default Notification;
