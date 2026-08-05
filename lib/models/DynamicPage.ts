import { Schema, model, models } from 'mongoose';

// A user-configured, API-driven page. The whole UI (columns, layout, controls)
// is data here rather than code, so pages can be built without a deploy.
const DynamicPageSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Page name is required'],
        trim: true,
    },
    description: { type: String, default: '' },

    endpoint: {
        method: { type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], default: 'GET' },
        url: { type: String, required: [true, 'URL is required'] },
        headers: { type: [Schema.Types.Mixed], default: [] },
        queryParams: { type: [Schema.Types.Mixed], default: [] },
        body: { type: String, default: '' },
        useProxy: { type: Boolean, default: false },
    },

    rowsPath: { type: String, default: '' },
    layout: { type: String, enum: ['table', 'cards'], default: 'table' },
    columns: { type: [Schema.Types.Mixed], default: [] },
    card: { type: Schema.Types.Mixed, default: () => ({ fieldKeys: [] }) },
    stats: { type: [Schema.Types.Mixed], default: [] },
    controls: { type: Schema.Types.Mixed, default: () => ({}) },

    lastOpened: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

DynamicPageSchema.index({ userId: 1 });
DynamicPageSchema.index({ userId: 1, lastOpened: -1 });

const DynamicPage = models.DynamicPage || model('DynamicPage', DynamicPageSchema);

export default DynamicPage;
