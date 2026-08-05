import { Schema, model, models } from 'mongoose';

// Environments for the Notes page. Deliberately a separate collection from the
// API testing `Environment` model — notes variables serve a different purpose
// and must not leak into (or be polluted by) API request environments.
const NoteEnvironmentSchema = new Schema({
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

NoteEnvironmentSchema.index({ userId: 1 });
NoteEnvironmentSchema.index({ userId: 1, isDefault: 1 });

const NoteEnvironment = models.NoteEnvironment || model('NoteEnvironment', NoteEnvironmentSchema);

export default NoteEnvironment;
