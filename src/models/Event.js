const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    // creatorID: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     default: false,
    //     required: true,
    //     refPath: 'onModel'
    // },
    // onModel: {
    //     type: String,
    //     required: true,
    //     enum: ['student', 'teacher']
    // },
    start_date: {
        type: Date,
        required: true,
    },
    end_date: {
        type: Date
    },
    last_date_reg: {
        type: Date
    },
    links: [{
        type: String
    }],
    institution: {
        type: String,
        required: true
    },
    media: {
        type: Buffer
    }
}, {
    timestamps: true
})

const Event = mongoose.model('Event', taskSchema)

module.exports = Event