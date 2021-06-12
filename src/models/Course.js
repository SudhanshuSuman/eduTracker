const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
// const Student = require('./Student')
// const Teacher = require('./Teacher')

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true,
        default: false,
        unique: true
    },


    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Teacher',
    },
    access: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    attendAndMarks: [{
        usn: {
            type: String,
        },
        dates: [{
            date: {
                type: String
            },
            present: {
                type: Boolean,
                default: false
            }
        }],
        marks : [{
            examType : {
                type : String
            },
            score: {
                type : Number
            }
        }]
    }]
})

courseSchema.virtual('courseStudent', {
    ref: 'Student',
    localField: '_id',
    foreignField: 'access'
})

// courseSchema.virtual('course-teacher' , {
//     ref : 'Teacher',
//     localField : '_id',
//     foreignField : 'owner'
// })

//ID => Teacher/Student ID
//id => Course ID
//isTeacher => To find out which feild to find in 
courseSchema.static.findCourseAccess = async (isTeacher, id, ID) => {
    const course = await Course.findOne({ id })

    if (!course) {
        throw new Error("Unable to find any course")
    }
    if (isTeacher) {
        const doesContain = Course.findOne({ owner: ID })
    } else {
        const doesContain = Course.findOne({ access: ID })
    }

    if (!doesContain) {
        throw new Error("You cannot access this course")
    }

    return course
}

const Course = mongoose.model('Course', courseSchema)

module.exports = Course