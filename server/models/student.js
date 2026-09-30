import mongoose from "mongoose"

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    dateOfBirth: {
      type: Date
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"]
    },

    phone: {
      type: String,
      trim: true
    },

    guardianName: {
      type: String,
      trim: true
    },

    address: {
      type: String,
      trim: true
    },

    school: {
      type: String,
      trim: true
    },

    className: {
      type: String,
      required: true,
      trim: true
    },

    board: {
      type: String,
      trim: true
    },

    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true
        },

        teacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Teacher",
          required: true
        },

        fee: {
          type: Number,
          required: true,
          min: 0
        },

        status: {
          type: String,
          enum: ["active", "paused", "left"],
          default: "active"
        },

        startedAt: {
          type: Date,
          default: Date.now
        },

        pausedAt: {
          type: Date
        },

        resumedAt: {
          type: Date
        },

        leftAt: {
          type: Date
        }
      }
    ],

    admissionDate: {
      type: Date,
      default: Date.now
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    status: {
      type: String,
      enum: ["active", "paused", "left"],
      default: "active"
    },

    pausedAt: {
      type: Date
    },

    resumedAt: {
      type: Date
    },

    leftAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

const Student = mongoose.model("Student", studentSchema)

export default Student