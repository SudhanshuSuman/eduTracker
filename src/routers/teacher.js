const express = require('express')
const router = new express.Router()
const Teacher = require('../models/Teacher')
const authT = require('../middleware/authTeacher')
const Course = require('../models/Course')



// Create a Teacher (account)
router.post('/teacher', async (req, res) => {

    const user = new Teacher(req.body)
    try {
        await user.save()
        const token = await user.generateTokens()
        res.status(200).send({ user, token })
    } catch (e) {
        console.log(e)
        res.status(400).send({ error: e })
    }
})


// Teacher login
router.post('/teacher/login', async (req, res) => {
    try {
        const user = await Teacher.findByCredentials(req.body.email, req.body.password)

        const token = await user.generateTokens()

        res.status(200).send({ user, token })
    } catch (e) {
        console.log(e)
        res.status(400).send({ error: e })
    }
})


// Logout teacher from current device
router.post('/teacher/logout', authT, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send("Logged out")
    } catch (e) {
        res.status(400).send({ Error: "Already Logged Out" })
    }
})


// Create Course (can be done only by a Teacher)
router.post('/teacher/courseCreation', authT, async (req, res) => {
    try {
        const course = await Course.findOne({ name: req.body.name, id: req.body.id })

        if (course)
            throw new Error("Course already found. Enter Again!!")

        const newCourse = new Course({
            ...req.body,
            owner: req.user
        })

        await newCourse.save()
        res.status(200).send(newCourse)

    } catch (e) {
        console.log(e)
        res.status(400).send({ error: e })
    }
})



// Delete Course (can be done only by a Teacher)
router.delete('/teacher/deleteCourse', authT, async (req, res) => {

    try {

        // if no such Course exists
        const course = await Course.findOne({ name: req.body.name, id: req.body.id })

        if (course)
            throw new Error("Course already found. Enter Again!!")


        // if Course exists but is not created by the Teacher making request
        if (req.user._id !== course.owner._id) {
            throw new Error("You have not created this course")
        }

        // everything good, then delete course
        await course.delete()

    } catch (e) {
        console.log(e)
        res.status(500).send({ error: e })
    }
})


// Get Courses created by the Teacher
// Get request can be made with:
// query containing id of the Course(returns one Course)
// query containing name of the Course(returns one Course)
// no query(returns all the Courses created by teacher)
router.get('/teacher/getcourses', authT, async (req, res) => {
    try {

        let course
        if (req.query.id) {
            course = await Course.findOne({ id: req.query.id, owner: req.user._id })

        } else if (req.query.name) {
            course = await Course.findOne({ name: req.query.name, owner: req.user._id })

        } else {
            course = await Course.find({ owner: req.user._id })

        }

        if (!course) {
            throw new Error("No course found!")
        }
        res.status(200).send(course)
    } catch (e) {
        console.log(e)
        res.status(400).send({ error: e })
    }
})



// Update the details of a Course(name, id)
router.patch('/teacher/update', authT, async (req, res) => {
    try {

        // Check if the Course is present and that the user requesting update is its owner, if true, update Course
        const course = await Course.updateOne({ owner: req.user._id, name: req.query.name }, { name: req.body.name, id: req.body.id })

        if (course.n === 0) {
            throw new Error("Unable to find the course")
        }

        res.status(200).send()

    } catch (e) {
        res.status(500).send({ error: e })
    }

})


// Mark attendance of a Student
// attendAndMarks: Query: ?present={{true/false}}
router.post('/course/:id/attendAndMarks/:usn/:date', authT, async (req, res) => {
    console.log(req.params)
    try {
        const course = await Course.findOne({ id: req.params.id })
        console.log(course)
        if (!course) {
            throw new Error('Course with id ' + req.params.id + ' does not exist')
        }

        const index = course.attendAndMarks.findIndex(student => student.usn === req.params.usn)
        if (index === -1) {
            throw new Error('No student with USN ' + req.params.usn + ' found')
        }

        if (!req.params.date) {
            throw new Error("'date' parameter must be provided")
        }

        // if Course with provided id, student with provided usn and date parameter exists, then mark attendance for that date
        course.attendAndMarks[index].dates = course.attendAndMarks[index].dates.concat({ date: req.params.date, present: (req.query.present === 'true' ? true : false) })

        await course.save()
        res.status(200).send(course.attendAndMarks[index])
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: e })
    }
})


// Get attendance record of a student
// Returns an array of all the dates on which a student was present/absent, number of presents, number of absents and total number of lectures
router.get('/course/:id/attendAndMarks/:usn', async (req, res) => {
    try {
        const course = await Course.findOne({ id: req.params.id })
        if (!course) {
            throw new Error('Course with id ' + req.params.id + ' does not exist')
        }

        const index = course.attendAndMarks.findIndex(student => student.usn === req.params.usn)
        if (index === -1) {
            throw new Error('No student with USN ' + req.params.usn + ' found')
        }
        const present = course.attendAndMarks[index].dates.filter(date => date.present).length
        const absent = course.attendAndMarks[index].dates.length - present

        res.status(200).send({ ...course.attendAndMarks[index].dates, present, absent, totalLectures: present + absent })

    } catch (e) {
        res.status(500).send({ error: e })
    }
})


// Post marks of a Student
router.post('/course/:id/scoring/:usn/:examType/:marks', authT, async (req, res) => {
    try {
        const course = await Course.findOne({ id: req.params.id })
        if (!course) {
            throw new Error('No such course is found')
        }
        const index = course.attendAndMarks.findIndex(student => student.usn === req.params.usn)
        if (index === -1) {
            throw new Error('No student with USN ' + req.params.usn + ' found')
        }
        console.log(index)
        course.attendAndMarks[index].marks = course.attendAndMarks[index].marks.concat({ examType: req.params.examType.toLowerCase(), score: req.params.marks })

        await course.save()

        res.status(200).send(course.attendAndMarks)

    } catch (e) {
        console.log(e)
        res.status(500).send({ error: e })
    }
})


// Get score of a Student from all the exams
router.get('/course/:id/getscore/:usn', async (req, res) => {
    try {

        const course = await Course.findOne({ id: req.params.id })
        if (!course) {
            throw new Error('No such course is found')
        }
        const index = course.attendAndMarks.findIndex(student => student.usn === req.params.usn)
        if (index === -1) {
            throw new Error('No student with USN ' + req.params.usn + ' found')
        }

        let score = 0;
        let total = 0;
        let allscore = []
        for (var i = 0, l = course.attendAndMarks[index].marks.length; i < l; i++) {
            let mark = course.attendAndMarks[index].marks[i]
            allscore.push({ "Exam": mark.examType, "Marks": mark.score })
            if (mark.examType.startsWith('q')) {
                total += 15
                score += mark.score
            }
            else if (mark.examType.startsWith('i')) {
                total += 50
                score += mark.score
            }

            else if (mark.examType.startsWith('e')) {
                total += 100
                score += mark.score
            }
        }

        const analysis = {
            "score": score,
            "total": total,
            "Current Percentage": (score / total) * 100
        }

        res.status(200).send({ allscore, analysis })



    } catch (e) {
        console.log(e)
        res.status(500).send({ error: e })
    }

})


module.exports = router