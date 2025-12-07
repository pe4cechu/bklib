import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
    {
        title: { type: String, require: true },
        category: { type: String, require: true },
        author: { type: String, require: true },
        imgSrc: { type: String, require: true },
        available: { type: Boolean, require: true },
        description: { type: String, require: true },
        other_images: { type: [String], require: true },
        year: { type: String, require: true },
        isbn: { type: String, require: true },
        pages: { type: Number, require: true },
        publisher: { type: String, require: true },
        quantity: { type: Number, require: true },
    },
    { timestamps: true }
);

export default mongoose.models.Book || mongoose.model('Book', bookSchema);
