const express = require('express')
require('./db/mongoose')
const eventRouter = require('./routers/event')
const teacherRouter = require('./routers/teacher')
const studentRouter = require('./routers/student')
const courseRouter = require('./routers/course')

const port = process.env.PORT
const app = express()

app.use(express.json())
app.use(eventRouter)
app.use(teacherRouter)
app.use(studentRouter)
app.use(courseRouter)

app.listen(port, () => {
    console.log('Server up on port:', port)
})