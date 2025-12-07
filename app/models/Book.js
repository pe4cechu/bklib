import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        category: { type: String, required: true },
        author: { type: String, required: true },
        imgSrc: { type: String, required: true },
        available: { type: Boolean, required: true },
        description: { type: String, required: true },
        other_images: { type: [String], required: true },
        year: { type: String, required: true },
        isbn: { type: String, required: true },
        pages: { type: Number, required: true },
        publisher: { type: String, required: true },
        quantity: { type: Number, required: true },
    },
    { timestamps: true }
);

export default mongoose.models.Book || mongoose.model('Book', bookSchema);
