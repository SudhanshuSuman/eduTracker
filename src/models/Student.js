const mongoose = require('mongoose')
const validator = require('validator')

const jwt = require('jsonwebtoken')
// const Student = require('./studentModel')
// const Course = require('./Course')
// const { Timestamp } = require('bson')


const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Write correct EMAIL');
            }
        }
    },
    password: {
        type: String,
        required: true,
        default: false
    },
    USN: {
        type: String,
        require: true,
    },
    // enrolledCourse : [{
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref :'Course',

    // }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

// Linking
studentSchema.virtual('course', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'access'
})

// Logging In


// studentSchema.statics.findByCredentials = async(email , password , USN) => {
studentSchema.statics.findByCredentials = async (email, password) => {
    const user = await Student.findOne({ email })
    if (!user) {
        throw new Error("Unable to Login")
    }

    const isMatchpass = password === user.password
    // const isMatchUSN = USN === user.USN
    // console.log(isMatchUSN , isMatchpass)
    // if(!isMatchpass || !isMatchUSN){
    if (!isMatchpass) {
        throw new Error("Unable to Login")
    }

    return user
}


//Generating Tokens
studentSchema.methods.generateTokens = async function () {
    const user = this
    console.log('student')
    const token = jwt.sign({ _id: user._id.toString() }, "thiscourseisshit")
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token

}

const Student = mongoose.model('Student', studentSchema)
module.exports = Student