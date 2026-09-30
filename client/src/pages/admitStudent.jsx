import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./admitStudent.css"

function AdmitStudent() {
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    guardianName: "",
    address: "",
    school: "",
    className: "",
    board: "",
    discount: ""
  })

  const [studentSubjects, setStudentSubjects] = useState([
    {
      subjectId: "",
      teacherId: "",
      fee: ""
    }
  ])

  const navigate = useNavigate()

  useEffect(() => {
    const getData = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const [subjectsResponse, teachersResponse] = await Promise.all([
          fetch("http://localhost:3000/api/subjects", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),

          fetch("http://localhost:3000/api/teachers", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ])

        const subjectsData = await subjectsResponse.json()
        const teachersData = await teachersResponse.json()

        if (!subjectsResponse.ok) {
          setMessage(subjectsData.message)
          return
        }

        if (!teachersResponse.ok) {
          setMessage(teachersData.message)
          return
        }

        setSubjects(subjectsData.subjects)
        setTeachers(teachersData.teachers)
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getData()
  }, [navigate])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }))
  }

  const handleSubjectChange = (index, field, value) => {
    setStudentSubjects((previousSubjects) => {
      const updatedSubjects = [...previousSubjects]

      updatedSubjects[index] = {
        ...updatedSubjects[index],
        [field]: value
      }

      if (field === "subjectId") {
        updatedSubjects[index].teacherId = ""
      }

      return updatedSubjects
    })
  }

  const addSubject = () => {
    setStudentSubjects((previousSubjects) => [
      ...previousSubjects,
      {
        subjectId: "",
        teacherId: "",
        fee: ""
      }
    ])
  }

  const removeSubject = (index) => {
    if (studentSubjects.length === 1) {
      return
    }

    setStudentSubjects((previousSubjects) =>
      previousSubjects.filter((_, subjectIndex) => subjectIndex !== index)
    )
  }

  const getTeachersForSubject = (subjectId) => {
    if (!subjectId) {
      return []
    }

    return teachers.filter((teacher) =>
      teacher.subjects.some(
        (subject) => subject._id === subjectId
      )
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setMessage("")
    setLoading(true)

    const token = localStorage.getItem("token")

    const data = {
      ...formData,
      discount: Number(formData.discount || 0),
      subjects: studentSubjects.map((subject) => ({
        subjectId: subject.subjectId,
        teacherId: subject.teacherId,
        fee: Number(subject.fee)
      }))
    }

    try {
      const response = await fetch("http://localhost:3000/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.message)
        setLoading(false)
        return
      }

      navigate("/students")
    } catch (error) {
      setMessage("Unable to connect to server")
    }

    setLoading(false)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <div className="page-header">
          <div>
            <h1>Admit a Student</h1>
            <p>Add a new student to the coaching center</p>
          </div>
        </div>

        {message && (
          <p className="page-message">{message}</p>
        )}

        <form
          className="admission-form"
          onSubmit={handleSubmit}
        >
          <section className="form-section">
            <h2>Student Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="guardianName">
                  Guardian Name
                </label>
                <input
                  id="guardianName"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="school">School</label>
                <input
                  id="school"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="className">Class *</label>
                <input
                  id="className"
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="board">Board</label>
                <input
                  id="board"
                  name="board"
                  value={formData.board}
                  onChange={handleChange}
                  placeholder="e.g. WBBSE"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="form-section">
            <h2>Login Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="email">Login Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Initial Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <div>
                <h2>Subjects</h2>
                <p>
                  Select the subjects and teachers assigned to
                  this student.
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={addSubject}
              >
                + Add Subject
              </button>
            </div>

            <div className="subject-header">
              <span>Subject</span>
              <span>Teacher</span>
              <span>Monthly Fee</span>
              <span></span>
            </div>

            {studentSubjects.map((studentSubject, index) => {
              const availableTeachers =
                getTeachersForSubject(
                  studentSubject.subjectId
                )

              return (
                <div
                  className="subject-row"
                  key={index}
                >
                  <select
                    value={studentSubject.subjectId}
                    onChange={(event) =>
                      handleSubjectChange(
                        index,
                        "subjectId",
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select Subject
                    </option>

                    {subjects.map((subject) => (
                      <option
                        key={subject._id}
                        value={subject._id}
                      >
                        {subject.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={studentSubject.teacherId}
                    onChange={(event) =>
                      handleSubjectChange(
                        index,
                        "teacherId",
                        event.target.value
                      )
                    }
                    required
                    disabled={!studentSubject.subjectId}
                  >
                    <option value="">
                      Select Teacher
                    </option>

                    {availableTeachers.map((teacher) => (
                      <option
                        key={teacher._id}
                        value={teacher._id}
                      >
                        {teacher.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    placeholder="₹"
                    value={studentSubject.fee}
                    onChange={(event) =>
                      handleSubjectChange(
                        index,
                        "fee",
                        event.target.value
                      )
                    }
                    required
                  />

                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeSubject(index)}
                    disabled={studentSubjects.length === 1}
                  >
                    Remove
                  </button>
                </div>
              )
            })}

            <div className="discount-row">
              <label htmlFor="discount">
                Admission Discount (%)
              </label>

              <input
                id="discount"
                name="discount"
                type="number"
                min="0"
                max="100"
                value={formData.discount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/students")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Admitting..." : "Admit Student"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default AdmitStudent