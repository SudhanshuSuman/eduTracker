const express = require('express')
const router = new express.Router()
const Teacher = require('../models/Teacher')
const Student = require('../models/Student')
const auth = require('../middleware/auth')

router.post('/login', async (req, res) => {
    try {
        const teacher = await Teacher.findOne({email: req.body.email, password: req.body.password})
        var role = 'teacher'
        if(!teacher) {
            const student = await Student.findByCredentials(req.body.email, req.body.password)
            var token = await student.generateTokens()
            role = 'student'
            res.status(200).send({ role, student, token })
        } else {
            var token = await teacher.generateTokens()
            res.status(200).send({ role, teacher, token })
        }
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
})

router.post('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send("Logged out")
    } catch (e) {
        res.status(400).send({ Error: "Already Logged Out" })
    }
})

module.exports = router