var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//ROOT ROUTE
router.get("/", function (req, res) {
    res.render("landing");
});

//Show Register Form
router.get("/register", function (req, res) {
    res.render("register", { page: "register" });
});

//Sign Up Logic
//username: jovimiad password:test123456
router.post("/register", function (req, res) {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    if (req.body.adminCode === process.env.AdminCode) {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register", { error: err.message });
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to Chenlu's YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

//Show Login Form
router.get("/login", function (req, res) {
    res.render("login", { page: "login" });
});

//Login Logic
//app.post("/login", middleware, callback)
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: "Welcome back!"

    }), function (req, res) {
    });

//LOGOUT ROUTE
router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

//FORGET PASSWORD

//Forget Route
router.get('/forgot', function (req, res) {
    res.render('forgot');
});

router.post('/forgot', function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({ email: req.body.email }, function (err, user) {
                if (!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'smtp.163.com',
                host: "smtp.163.com",
                secureConnection: true,
                port:465,
                auth: {
                    user: 'jovimiadjiang@163.com',
                    pass: process.env.MyEmailPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'jovimiadjiang@163.com',
                subject: 'Chenlu\'s YelpCamp Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

// Reset Route
router.get('/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', { token: req.params.token });
    });
});

router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function (err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },
        function (user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'smtp.163.com',
                host: "smtp.163.com",
                secureConnection: true,
                port:465,
                auth: {
                    user: 'jovimiadjiang@163.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'jovimiadjiang@163.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function (err) {
        res.redirect('/campgrounds');
    });
});

//USER PROFILE SHOW ROUTE
router.get("/users/:id", function (req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        if (err || !foundUser) {
            req.flash("error", "User not found");
            return res.redirect("/campgrounds");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function (err, campgrounds) {
            if (err) {
                req.flash("error", "Something went wrong.");
                res.redirect("/campgrounds");
            }
            res.render("users/show", { user: foundUser, campgrounds: campgrounds });
        });
    });
});

//EDIT USER ROUTE
router.get("/users/:id/edit", middleware.checkUserOwnership, function (req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash("error", "Something went wrong.");
            res.redirect("/campgrounds");
        } else {
            res.render("users/edit", { user: foundUser });
        }
    });
});

// UPDATE USER ROUTE
router.put("/users/:id", middleware.checkUserOwnership, function (req, res) {
    //find and update the correct user
    User.findByIdAndUpdate(req.params.id, req.body.user, function (err, updatedUser) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success", "Successfully Updated!");
            res.redirect("/users/" + updatedUser._id);
        }
    });
});

// //DESTROY USER ROUTE
// router.delete("/users/:id", function(req, res){
//     User.findByIdAndRemove(req.params.id, function(err){
//         if(err){
//             res.redirect("/campgrounds");
//         } else {
//             req.logout();
//             res.redirect("/campgrounds");   
//         }
//     });
// });

// DESTROY USER ROUTE

router.delete("/users/:id", middleware.checkUserOwnership, async (req, res) => {
    try {
        let foundUser = await User.findById(req.params.id);
        Campground.find().where("author.id").equals(foundUser._id).exec(function (err, campgrounds) {
            if (err || Object.keys(campgrounds).length !== 0) {
                // console.log(typeof campgrounds);
                req.flash("error", "You have to delete all your campgrounds first!");
                res.redirect("/campgrounds");
            } else {
                foundUser.remove();
                req.flash("success", "Successfully Deleted!");
                res.redirect("/campgrounds");
            }
        });
    } catch (error) {
        // console.log(error.message);
        res.redirect("/campgrounds");
    }
});

module.exports = router;