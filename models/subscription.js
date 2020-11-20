const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      required: true,
    },
    plan_id: {
      type: String,
      required: true,
    },
    code: {
      type: String,
    },
    amount: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "PROCESSING",
    },
    expires: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toObject: {
      transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

exports.Subscription = Subscription;
