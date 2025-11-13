const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const noteSchema = new Schema({
    title: String,
    fileUrl: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: "userModel",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model("Note", noteSchema);
