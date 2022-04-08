const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Campground = require('../models/campground');
const ExpressError = require('../utils/ExpressError');
const { campgroundSchema } = require('../schemas.js');

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}
const verifiedUser = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    next();
}


router.get('/', verifiedUser, catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    if (!req.session.user_id) {
        return res.redirect('/login');

    }

    res.render('campgrounds/index', { campgrounds, ...req.session })
}))
router.get('/new', verifiedUser, (req, res) => {
    res.render('campgrounds/new', { ...req.session });
})


router.get('/:id/edit', verifiedUser, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);

    if (!campground) {
        req.flash('error', 'Edit Error! Cannot find that campground')
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground, ...req.session });
}))

router.get('/:id', verifiedUser, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews');


    if (!campground) {
        req.flash('error', 'Cannot find that campground')
        return res.redirect('/campgrounds');
    }
    let sum = 0;
    let br = 0;
    for (let r of campground.reviews) {
        br = br + 1;
        sum = sum + r.rating;
    }
    const avg = sum / br;
    res.render('campgrounds/show', { avg, campground, ...req.session });
}))


router.put('/:id', validateCampground, catchAsync(async (req, res, next) => {
    const campground = await Campground.findByIdAndUpdate(req.params.id, { ...req.body.campground });
    req.flash('success', 'Successfully updated campgorund!');
    res.redirect(`/campgrounds/${campground.id}`);

}))

router.post('/', validateCampground, catchAsync(async (req, res, next) => {
    /*  if (!req.body.campground) throw new ExpressError('Invalid campground Data!', 400); */
    const campground = new Campground(req.body.campground);
    await campground.save();
    req.flash('success', 'Successfully created new campgorund!');
    res.redirect(`/campgrounds/${campground._id}`);

}))

router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campgorund!');
    res.redirect(`/campgrounds`);
}))

module.exports = router;
