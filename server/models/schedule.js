import mongoose from "mongoose"

const scheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      required: true
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },

    className: {
      type: String,
      required: true,
      trim: true
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },

    startTime: {
      type: String,
      required: true,
      trim: true
    },

    endTime: {
      type: String,
      required: true,
      trim: true
    },

    room: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["active", "suspend", "delay"],
      default: "active"
    }
  },
  { timestamps: true }
)

const Schedule = mongoose.model("Schedule", scheduleSchema)

export default Schedule