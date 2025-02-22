const mongoose = require("mongoose");
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,  // Fixed "Objectid" to "ObjectId"
        ref: "User",
        required: true,
    },
    products: [{
        productId: {
            type: Schema.Types.ObjectId,  // Fixed "Objectid" to "ObjectId"
            ref: "product",
            required: true,
        },
        addedOn: {
            type: Date,
            default: Date.now
        }
    }]
});

const WishList = mongoose.model("Wishlist", wishlistSchema);
module.exports = WishList;
