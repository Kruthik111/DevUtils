import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false,
    },
    passwordPlain: {
        type: String,
        select: false, // Don't return by default, but available in DB
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        minLength: [2, 'Name should be at least 2 characters'],
        maxLength: [50, 'Name should be less than 50 characters'],
    },
    image: {
        type: String,
    },
    theme: {
        type: String,
        default: "light",
    },
    customTheme: {
        type: Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});

const User = models.User || model('User', UserSchema);

export default User;
