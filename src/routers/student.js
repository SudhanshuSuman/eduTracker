const express = require('express')
const router = express.Router()
const Student = require('../models/Student')
const Course = require('../models/Course')
const auth = require('../middleware/authStudent')
const authC = require('../middleware/auth')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
// const { ObjectID } = require('mongodb')


// Create a new Student (account)
router.post('/student', async (req, res) => {
    console.log(req.body)

    const user = new Student(req.body)
    try {
        await user.save()
        const token = await user.generateTokens()
        res.status(200).send({ user, token })
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})


// Student login
router.post('/student/login', async (req, res) => {
    try {
        const user = await Student.findByCredentials(req.body.email, req.body.password, req.body.USN)

        const token = await user.generateTokens()

        res.status(200).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})


// Logout the current device
router.post('/student/logout', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send("Logged out")
    } catch (e) {
        res.status(400).send({ Error: "Already Logged Out" })
    }
})


// Enroll in a Course
router.post('/student/enrollment', auth, async (req, res) => {
    try {

        const course = await Course.findOne({ name: req.body.name, id: req.body.id })
        console.log(course)

        // await course.populate('access').execPopulate()

        console.log(course.access.indexOf(req.user._id))
        if (course.access.indexOf(req.user._id) >= 0) {
            throw new Error('Aready Registed')
        } else {
            course.access = course.access.concat(req.user)
            course.attendAndMarks = course.attendAndMarks.concat({ usn: req.user.USN, dates: [], marks: [] })
            await course.save()
        }

        console.log(course)
        res.send(course)




    } catch (e) {
        console.log("Error", e)
        res.status(400).send(e)
    }
})


// Unenroll from a Course / Delete
router.delete('/student/deleteCourse', auth, async (req, res) => {

    try {
        const course = await Course.findOne({ name: req.body.name, access: req.user._id, id: req.body.id })
        console.log(course)
        const enrolled = (course.access.indexOf(req.user._id))
        course.access.splice(enrolled, 1)

        const attendance = (course.attendance.indexOf(req.user.USN))
        course.attendance.splice(attendance, 1)

        await course.save()
        console.log(course)
        res.status(200).send(course)

    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
})


// Get all the Courses enrolled in
router.get('/student/getcourses', auth, async (req, res) => {

    try {

        const courses = await Course.find({ access: req.user._id })
        console.log(courses)
        res.status(200).send(courses)

    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
})


// For multer(file uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dirPath = './course/notes/' + req.params.id
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath)
        }
        cb(null, dirPath)
    },
    filename: (req, file, cb) => {

        console.log(file.originalname)
        cb(null, Date.now() + '_' + file.originalname)
    }
})


// File: Maximum size: 100 MB, Allowed types: .pdf, .doc
const upload = multer({
    limits: {
        fileSize: 100 * 1024 * 1024
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(pdf|doc)$/)) {
            return cb(new Error('Allowed file extensions: *.pdf/*.doc'))
        }
        cb(undefined, true)
    },
    storage
})


// Middleware to verify user access to course notes/files
const verifyAccess = async (req, res, next) => {
    try {
        const course = await Course.findOne({ _id: req.params.id })
        if (!course) {
            res.status(404).send('No such course exists!')
        } else {
            const enrolled = course.access.includes(req.user._id) || course.owner.equals(req.user._id)
            if (!enrolled) {
                res.status(401).send('No access course with id ' + req.params.id + ' found')
            } else {
                next()
            }
        }

    } catch (e) {
        res.status(500).send()
    }
    // next()
}


// Upload some notes(allowed extensions: .pdf, .doc)
router.post('/course/file/:id/upload', authC, verifyAccess, upload.single('notes'), async (req, res) => {
    try {
        res.status(200).send()
    } catch (e) {
        res.status(500).send(e)
    }
})


// Get list of all the files in the course
router.get('/course/:id/file/list', authC, verifyAccess, async (req, res) => {
    try {
        const dirPath = './course/notes/' + req.params.id
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath)
        }
        const files = fs.readdirSync(dirPath)
        res.status(200).send({ fileNameList: files, fileCount: files.length })
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})


// Get a file from the Course. File names obtained from the get list of files request can be used to get a particular file.
router.get('/course/file/:id/:fileName', authC, verifyAccess, async (req, res) => {
    try {
        // const course = await Course.findOne({ _id: req.params.id, access: req.user._id })
        // if(!course) {
        //     res.status(404).send('No enrolled course with id ' + req.params.id + ' found')
        // }
        var id = req.params.id
        var file = req.params.fileName

        const filePath = path.resolve('course/notes/' + id + '/' + file)

        res.sendFile(filePath)
    } catch (e) {
        res.status(e).send()
    }
})


module.exports = router