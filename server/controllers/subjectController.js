import Subject from "../models/subject.js"

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 })

    res.json({
      subjects
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get subjects",
      error: error.message
    })
  }
}

const createSubject = async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({
        message: "Subject name is required"
      })
    }

    const existingSubject = await Subject.findOne({ name })

    if (existingSubject) {
      return res.status(409).json({
        message: "Subject already exists"
      })
    }

    const subject = await Subject.create({
      name,
      description
    })

    res.status(201).json({
      message: "Subject created successfully",
      subject
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to create subject",
      error: error.message
    })
  }
}

export { getSubjects, createSubject }