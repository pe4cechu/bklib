import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema({
    userId: { type: String },
    userEmail: { type: String },
    name: { type: String },
    bookTitle: { type: String, required: true },
    quantity: { type: Number, required: true },
    dateReturn: { type: Date, required: true },
    note: { type: String },
    status: { type: String, default: 'pending' }, // pending, approved, rejected, returned
    returnStatus: { type: String, default: 'borrowed' }, // borrowed, pending_return, returned
    createdAt: { type: Date, default: Date.now },
});

// Avoid model overwrite in dev hot-reload
const Request = mongoose.models.Request || mongoose.model('Request', RequestSchema);
export default Request;
