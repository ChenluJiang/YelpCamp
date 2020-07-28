var moogoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data = [
    {
        name: "Yosemite National Park, USA", 
        image: "https://www.yosemite.com/wp-content/uploads/2019/03/places-to-stay-tablet-768x450.jpg",
        description: "Ninety-five percent of Yosemite National Park is designated wilderness, which means no cars, no buildings, and no electricity. Sleep under the stars and hike up to Glacier Point for a view of Yosemite Valley, Half Dome, and Yosemite Falls. Make sure you store your food properly though — black bears are common!"
    },
    {
        name: "Shenandoah National Park, USA", 
        image: "https://www.edfuhr.com/images/xl/Shenandoah-Overlook_X5T8545.jpg",
        description: "Conveniently located just 75 miles from Washington, D.C., Shenandoah National Park makes for the perfect nature retreat. You'll find 101 miles of the Appalachian Trail and just overall peaceful, wild beauty. Hike away the weekend among the park's many waterfalls."
    },
    {   name: "Miyajima Japan",
        image: "https://n81az3lk6pr44bp8k3kgs2ym-wpengine.netdna-ssl.com/wp-content/uploads/sites/42/2020/04/Miyajima_Hiroshima-Itsukushima.jpg",
        description: "Hey, the island of Miyajima is just a short boat ride away from Hiroshima. You can pitch your tent here year-round, or rent a cabin. The island is speckled with temples if you like a little culture with your camping. But the best part of staying on Miyajima? Walking among the domesticated deer that populate the island."
    },
    {
        name: "Corcovado National Park, Costa Rica",
        image:"https://d3hne3c382ip58.cloudfront.net/files/uploads/bookmundi/resized/cmsfeatured/beach-corcovado-national-park-1520395100-785X440.jpg",
        description:"Corcovado National Park is home to five percent of the world's biodiversity — National Geographic described it as the most “geographically intense” place in the world. Camping is a great option for a visit to Costa Rica: you'll be at the heart of the rainforest, away from the country's touristy resorts."
    }
]


function seedDB(){
    //Remove all campgrounds
    Campground.deleteMany({}, function(err){
        // if(err){
        //     console.log(err);
        // }
        // console.log("removed campgrounds!");

        // // add a few campgrounds
        // data.forEach(function(seed){
        //     Campground.create(seed, function(err, campground){
        //         if(err){
        //             console.log(err);
        //         } else {
        //             console.log("added a campground");
        //             //create a comment
        //             Comment.create({text:"This place is great, but I wish there was internet",
        //             author:"Homer"
        //         },function(err, comment){
        //             if(err){
        //                 console.log(err);
        //             } else {
        //                 campground.comments.push(comment);
        //                 campground.save();
        //                 console.log("Created new comment");
        //             }
        //         })
        //         }
        //     });
        // });
    });

    
}

module.exports = seedDB;


