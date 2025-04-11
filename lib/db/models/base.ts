import mongoose from "mongoose";

export interface IBase {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
