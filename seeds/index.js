
const mongoose = require('mongoose');
const cities = require('./cities');
const Campground = require('../models/campground');
const { descriptors, places } = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error!"));
db.once("open", () => {
    console.log("Database connection!");
});

//sample predstavlja random descriptor i places iz file-a seedHelpers
const sample = array => array[Math.floor(Math.random() * array.length)];

//seedDB kreira collection campground (brise cijelu bazu i unosi nove podatke)
const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;

        const camp = new Campground({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: 'https://i.picsum.photos/id/434/4928/3264.jpg?hmac=tS5UBAIGJmQwCLJC0uvmHYHxQi5RDaXXJZy2H1WhZwo',
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aperiam aliquid pariatur sint voluptatibus tempora, corporis temporibus laudantium voluptatem asperiores amet corrupti minima repudiandae consequatur dolor maxime rerum accusamus facere soluta?',
            price
        })
        await camp.save();

    }
}
seedDB();