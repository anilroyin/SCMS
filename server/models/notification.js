import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    senderRole: {
      type: String,
      enum: ["admin", "teacher"],
      required: true
    },

    targetType: {
      type: String,
      enum: [
        "everyone",
        "all_students",
        "all_teachers",
        "fee_due",
        "fee_partial",
        "individual_student",
        "individual_teacher",
        "teacher_students",
        "teacher_class",
        "teacher_individual_student"
      ],
      required: true
    },

    className: {
      type: String,
      trim: true
    },

    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    adminRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

const Notification = mongoose.model(
  "Notification",
  notificationSchema
)

export default Notification