import mongoose, { Schema, model, models } from 'mongoose';

const TextBlockSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['text', 'code', 'link', 'snippet', 'image', 'todo'], required: true },
    content: { type: String, default: '' },
    language: { type: String }, // For code blocks
    copyMode: { type: String, enum: ['active', 'passive'] }, // For snippets
    completed: { type: Boolean, default: false }, // For todos
    metadata: { type: Schema.Types.Mixed },
});

const NoteSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    id: { type: String, required: true }, // Client-side ID
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    blocks: [TextBlockSchema],
    groupId: { type: String }, // Optional linkage to a group
    tabId: { type: String },   // Optional linkage to a tab
}, {
    timestamps: true,
});

// Index for faster queries by user
NoteSchema.index({ userId: 1, id: 1 }, { unique: true });

const Note = models.Note || model('Note', NoteSchema);

export default Note;
