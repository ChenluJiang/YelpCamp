var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'jovimiad',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//INDEX -- show all campgrounds
router.get("/", function (req, res) {
    var noMatch = null;
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({ name: regex }, function (err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                if (allCampgrounds.length < 1) {
                    noMatch = "No such campground exists yet. Try another.";
                }
                res.render("campgrounds/index", { campgrounds: allCampgrounds, noMatch: noMatch, page: "campground" });
            }
        });
    } else {
        // eval(require("locus"));
        // Get all campgrounds from DB
        Campground.find({}, function (err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", { campgrounds: allCampgrounds, noMatch: noMatch, page: "campground" });
            }
        });
    }
});

//NEW v1-- show form to create new campground
router.get("/new2", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new2");
});

//NEW v2-- show form to create new campground
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new");
});

//CREATE v1v2-- add new campground to DB

router.post("/", middleware.isLoggedIn, upload.single('image'), function (req, res) {
    if(req.body.campground.image === undefined){
        cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('back');
              }
            // add cloudinary url for the image to the campground object under image property
            // console.log(req.body.campground.image);
            req.body.campground.image = result.secure_url;
            // add image's public_id to campground object
            req.body.campground.imageId = result.public_id;
            // add author to campground
            req.body.campground.author = {
                id: req.user._id,
                username: req.user.username
            }
            Campground.create(req.body.campground, function (err, campground) {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                res.redirect('/campgrounds/' + campground.id);
            });
        });
    } else {
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        }
        Campground.create(req.body.campground, function (err, campground) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            // console.log(req.body.campground.imageId);
            res.redirect('/campgrounds/' + campground.id);
        });
    }
  
    // var name = req.body.name;
    // var price = req.body.price;
    // var image = req.body.image;
    // var desc = req.body.description;
    // var author = {
    //     id: req.user._id,
    //     username: req.user.username
    // }
    // var newCampground = { name: name, price: price, image: image, description: desc, author:author};
    // //Create a new campground and save to DB
    // Campground.create(newCampground, function (err, newlyCreated) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         //redirect back to campgrounds
    //         // console.log(newlyCreated);
    //         res.redirect("/campgrounds");
    //     }
    // });
});

//CREATE - add new campground to DB
// router.post("/", middleware.isLoggedIn, function(req, res){
//     // get data from form and add to campgrounds array
//     var name = req.body.name;
//     var image = req.body.image;
//     var desc = req.body.description;
//     var author = {
//         id: req.user._id,
//         username: req.user.username
//     }
//     geocoder.geocode(req.body.location, function (err, data) {
//       if (err || !data.length) {
//         console.log(err);
//         req.flash('error', 'Invalid address');
//         return res.redirect('back');
//       }
//       var lat = data[0].latitude;
//       var lng = data[0].longitude;
//       var location = data[0].formattedAddress;
//       var newCampground = {name: name, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
//       // Create a new campground and save to DB
//       Campground.create(newCampground, function(err, newlyCreated){
//           if(err){
//               console.log(err);
//           } else {
//               //redirect back to campgrounds page
//               console.log(newlyCreated);
//               res.redirect("/campgrounds");
//           }
//       });
//     });
//   });

//SHOW -- shows more info about one campground
router.get("/:id", function (req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            // console.log(err);
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            // console.log(foundCampground);
            //render show template with that campground
            res.render("campgrounds/show", { campground: foundCampground });
            // console.log(foundCampground.imageId);
        }
    });
});

// EDIT1 CAMPGROUND ROUTE
router.get("/:id/edit2", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        res.render("campgrounds/edit2", { campground: foundCampground });
    });
});
// EDIT2 CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        res.render("campgrounds/edit", { campground: foundCampground });
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", upload.single('image'), function(req, res){
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file && campground.imageId !== undefined) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            } else if (req.file){
                try {
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;
                } catch(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            } else if (campground.imageId !== undefined){
                await cloudinary.v2.uploader.destroy(campground.imageId);
                campground.image = req.body.campground.image;
                campground.imageId = undefined;
                // console.log(campground.imageId);
            } else {
                campground.image = req.body.campground.image;
            } 
            campground.name = req.body.campground.name;
            campground.price = req.body.campground.price;
            campground.description = req.body.campground.description;
            campground.website = req.body.campground.website;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

// router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function (req, res) {
//     //find and update the correct campground
//     Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, updatedCampground) {
//         if (err) {
//             req.flash("error", err.message);
//             res.redirect("back");
//         } else {
//             req.flash("success", "Successfully Updated!");
//             res.redirect("/campgrounds/" + req.params.id);
//         }
//     });
//     //redirect somewhere (show page)
// });

// UPDATE CAMPGROUND ROUTE
// router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
//     geocoder.geocode(req.body.location, function (err, data) {
//       if (err || !data.length) {
//         req.flash('error', 'Invalid address');
//         console.log(err);
//         return res.redirect('back');
//       }
//       req.body.campground.lat = data[0].latitude;
//       req.body.campground.lng = data[0].longitude;
//       req.body.campground.location = data[0].formattedAddress;

//       Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
//           if(err){
//               req.flash("error", err.message);
//               res.redirect("back");
//           } else {
//               req.flash("success","Successfully Updated!");
//               res.redirect("/campgrounds/" + campground._id);
//           }
//       });
//     });
//   });

// DESTROY CAMPGROUND ROUTE
router.delete('/:id', function(req, res) {
    Campground.findById(req.params.id, async function(err, campground) {
      if(err) {
        req.flash("error", err.message);
        return res.redirect("back");
      } else {
          if(campground.imageId !== undefined){
            try {
                await cloudinary.v2.uploader.destroy(campground.imageId);
                campground.remove();
                req.flash('success', 'Campground deleted successfully!');
                res.redirect('/campgrounds');
            } catch(err) {
                if(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
                }
            }
          } else {
            try {
                campground.remove();
                req.flash('success', 'Campground deleted successfully!');
                res.redirect('/campgrounds');
            } catch(err) {
                if(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
                }
            }
        }
      }
    });
  });


// router.delete("/:id", middleware.checkCampgroundOwnership, async (req, res) => {
//     try {
//         let foundCampground = await Campground.findById(req.params.id);
//         await foundCampground.remove();
//         req.flash("success", "Successfully Deleted!");
//         res.redirect("/campgrounds");
//     } catch (error) {
//         // console.log(error.message);
//         res.redirect("/campgrounds");
//     }
// });

// router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
//     Campground.findByIdAndRemove(req.params.id, function(err){
//         if(err){
//             res.redirect("/campgrounds");
//         } else {
//             res.redirect("/campgrounds");
//         }
//     });
// });

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;