import Schedule from "../models/schedule.js"
import Subject from "../models/subject.js"
import Teacher from "../models/teacher.js"

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number)

  return hours * 60 + minutes
}

const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate("subjectId", "name")
      .populate("teacherId", "teacherId name")
      .sort({ createdAt: 1 })

    res.json(schedules)
  } catch (error) {
    res.status(500).json({
      message: "Failed to get schedules",
      error: error.message
    })
  }
}

const getMySchedules = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({
      userId: req.user.userId
    })

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found"
      })
    }

    const schedules = await Schedule.find({
      teacherId: teacher._id
    })
      .populate("subjectId", "name")
      .populate("teacherId", "teacherId name")
      .sort({ day: 1, startTime: 1 })

    res.json(schedules)
  } catch (error) {
    res.status(500).json({
      message: "Failed to get teacher schedules",
      error: error.message
    })
  }
}

const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("subjectId", "name")
      .populate("teacherId", "teacherId name")

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found"
      })
    }

    res.json(schedule)
  } catch (error) {
    res.status(500).json({
      message: "Failed to get schedule",
      error: error.message
    })
  }
}

const createSchedule = async (req, res) => {
  try {
    const {
      day,
      subjectId,
      className,
      teacherId,
      startTime,
      endTime,
      room,
      status
    } = req.body

    if (
      !day ||
      !subjectId ||
      !className ||
      !teacherId ||
      !startTime ||
      !endTime ||
      !room
    ) {
      return res.status(400).json({
        message: "All schedule fields are required"
      })
    }

    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        message: "End time must be after start time"
      })
    }

    const subject = await Subject.findById(subjectId)

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found"
      })
    }

    const teacher = await Teacher.findById(teacherId)

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      })
    }

    const teacherTeachesSubject = teacher.subjects.some(
      (id) => id.toString() === subjectId
    )

    if (!teacherTeachesSubject) {
      return res.status(400).json({
        message: "This teacher is not assigned to the selected subject"
      })
    }

    const existingSchedules = await Schedule.find({
      day,
      status: "active"
    })

    for (const schedule of existingSchedules) {
      const existingStart = timeToMinutes(schedule.startTime)
      const existingEnd = timeToMinutes(schedule.endTime)

      const timeOverlap =
        existingStart < endMinutes &&
        existingEnd > startMinutes

      if (!timeOverlap) {
        continue
      }

      if (schedule.room.toLowerCase() === room.trim().toLowerCase()) {
        return res.status(409).json({
          message:
            `${room} is already occupied on ${day} during this time`
        })
      }

      if (schedule.teacherId.toString() === teacherId) {
        return res.status(409).json({
          message:
            "This teacher already has another class during this time"
        })
      }
    }

    const schedule = await Schedule.create({
      day,
      subjectId,
      className: className.trim(),
      teacherId,
      startTime,
      endTime,
      room: room.trim(),
      status: status || "active"
    })

    const createdSchedule = await Schedule.findById(schedule._id)
      .populate("subjectId", "name")
      .populate("teacherId", "teacherId name")

    res.status(201).json({
      message: "Schedule created successfully",
      schedule: createdSchedule
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to create schedule",
      error: error.message
    })
  }
}

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params

    const {
      day,
      subjectId,
      className,
      teacherId,
      startTime,
      endTime,
      room,
      status
    } = req.body

    const schedule = await Schedule.findById(id)

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found"
      })
    }

    const updatedDay = day || schedule.day
    const updatedSubjectId =
      subjectId || schedule.subjectId.toString()
    const updatedTeacherId =
      teacherId || schedule.teacherId.toString()
    const updatedStartTime =
      startTime || schedule.startTime
    const updatedEndTime =
      endTime || schedule.endTime
    const updatedRoom =
      room?.trim() || schedule.room

    const startMinutes = timeToMinutes(updatedStartTime)
    const endMinutes = timeToMinutes(updatedEndTime)

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        message: "End time must be after start time"
      })
    }

    const subject = await Subject.findById(
      updatedSubjectId
    )

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found"
      })
    }

    const teacher = await Teacher.findById(
      updatedTeacherId
    )

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      })
    }

    const teacherTeachesSubject = teacher.subjects.some(
      (subjectId) =>
        subjectId.toString() === updatedSubjectId
    )

    if (!teacherTeachesSubject) {
      return res.status(400).json({
        message:
          "This teacher is not assigned to the selected subject"
      })
    }

    const updatedStatus =
      status || schedule.status

    if (updatedStatus === "active") {
      const existingSchedules = await Schedule.find({
        day: updatedDay,
        status: "active",
        _id: { $ne: id }
      })

      for (const existingSchedule of existingSchedules) {
        const existingStart = timeToMinutes(
          existingSchedule.startTime
        )

        const existingEnd = timeToMinutes(
          existingSchedule.endTime
        )

        const timeOverlap =
          existingStart < endMinutes &&
          existingEnd > startMinutes

        if (!timeOverlap) {
          continue
        }

        if (
          existingSchedule.room.toLowerCase() ===
          updatedRoom.toLowerCase()
        ) {
          return res.status(409).json({
            message:
              `${updatedRoom} is already occupied on ${updatedDay} during this time`
          })
        }

        if (
          existingSchedule.teacherId.toString() ===
          updatedTeacherId
        ) {
          return res.status(409).json({
            message:
              "This teacher already has another class during this time"
          })
        }
      }
    }

    schedule.day = updatedDay
    schedule.subjectId = updatedSubjectId
    schedule.className =
      className?.trim() || schedule.className
    schedule.teacherId = updatedTeacherId
    schedule.startTime = updatedStartTime
    schedule.endTime = updatedEndTime
    schedule.room = updatedRoom
    schedule.status = updatedStatus

    await schedule.save()

    const updatedSchedule =
      await Schedule.findById(schedule._id)
        .populate("subjectId", "name")
        .populate("teacherId", "teacherId name")

    res.json({
      message: "Schedule updated successfully",
      schedule: updatedSchedule
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to update schedule",
      error: error.message
    })
  }
}

const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(
      req.params.id
    )

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found"
      })
    }

    await schedule.deleteOne()

    res.json({
      message: "Schedule deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete schedule",
      error: error.message
    })
  }
}

export {
  getSchedules,
  getMySchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
}