const express = require('express')
const Event = require('../models/Event')
const mongoose = require('mongoose')

const router = express.Router()

// Create Event: // Authorization to be added
router.post('/event', async (req, res) => {
    const event = new Event(req.body)

    try {
        await event.save()
        res.status(201).send({ event })
    } catch(e) {
        res.status(400).send(e)
    }
})

// Display all events. queries:
// sortBy=field-asc/desc
// upcoming=false(by would be true by default)
// institution=institutionName
router.get('/event', async (req, res) => {
    const toMatch = {}
    const sort = { 'start_date': -1 }

    if(req.query.sortBy) {
        const sortBy = req.query.sortBy.split('-')
        sort[sortBy[0]] = sortBy[1] === 'asc' ? 1 : -1
    }

    if(req.query.start_date===undefined) {
        const currentDate = Date.now()
        toMatch['start_date'] = { '$gte': currentDate }

    } else {
        const temp = req.query.start_date.split('-')

        if (temp[0] === 'within') {
            const tillDate = Date.now() + temp[1]*24*60*60*1000
            toMatch['start_date'] = { '$gte': Date.now(), '$lte': tillDate }
            sort['start_date'] = 1

        } else if (temp[0] == 'bw') {
            toMatch['start_date'] = { '$gte': temp[1], '$lte': temp[2] }
            sort['start_date'] = 1
        }
    }

    // if(req.query.after) {
    //     toMatch['$expr'] = { '$gt': [ '$start_date', req.query.after ] }
    // }

    if(req.query.institution) {
        toMatch['institution'] = req.query.institution
    }

    try {
        const events = await Event.find(toMatch, null, {
            sort
        })
        res.status(200).send(events)
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router