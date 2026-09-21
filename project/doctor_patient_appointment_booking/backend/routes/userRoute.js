const express= require("express");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");
const fs=require("fs");
const path=require("path");
require("dotenv").config();
const { Usermodel, DEFAULT_CONSULTATION_SLOTS } = require("../models/userModel");
const { authentication } = require("../middlewares/authenticationMiddleware");
const { authorisation } = require("../middlewares/authorizationMiddleware");
const { Bookingmodel } = require("../models/bookingModel");

const userRoute=express.Router();

//Get all the doctors
userRoute.get("/doctors",async(req,res)=>{
    try {
        let allDoctor=await Usermodel.find({role:"doctor"}).select("-password")
        res.json({"msg":"All doctors details","data":allDoctor})
    } catch (error) {
        console.log("error from getting all doctor route",error);
        res.json({"msg":"error while getting all doctors details"})
    }
}) 

userRoute.get("/doctors/id/:id", async (req, res) => {
    try {
        const doctor = await Usermodel.findOne({ _id: req.params.id, role: "doctor" }).select("name email specialty location consultationSlots");
        if (!doctor) return res.status(404).json({ msg: "Doctor not found." });
        const data = doctor.toObject();
        data.consultationSlots = data.consultationSlots?.length ? data.consultationSlots : DEFAULT_CONSULTATION_SLOTS;
        const date = String(req.query.date || "").trim();
        if (date) {
            const booked = await Bookingmodel.find({ doctorId: doctor._id.toString(), bookingDate: date }).select("bookingSlot -_id");
            data.bookedSlots = [...new Set(booked.map((booking) => booking.bookingSlot))];
        } else {
            data.bookedSlots = [];
        }
        return res.json({ data });
    } catch (error) {
        return res.status(400).json({ msg: "Invalid doctor." });
    }
});

userRoute.get("/doctor/availability", authentication, authorisation(["doctor"]), async (req, res) => {
    const doctor = await Usermodel.findById(req.body.userId).select("consultationSlots");
    const today = new Date().toISOString().slice(0, 10);
    const booked = await Bookingmodel.find({ doctorId: req.body.userId, bookingDate: { $gte: today } }).select("bookingSlot -_id");
    const consultationSlots = doctor?.consultationSlots?.length ? doctor.consultationSlots : DEFAULT_CONSULTATION_SLOTS;
    return res.json({ consultationSlots, bookedSlots: [...new Set(booked.map((booking) => booking.bookingSlot))] });
});

userRoute.patch("/doctor/availability", authentication, authorisation(["doctor"]), async (req, res) => {
    const slots = Array.isArray(req.body.consultationSlots)
        ? [...new Set(req.body.consultationSlots.map((slot) => String(slot).trim()).filter(Boolean))].slice(0, 12)
        : [];
    if (!slots.length) return res.status(400).json({ msg: "Keep at least one consultation time." });
    const today = new Date().toISOString().slice(0, 10);
    const booked = await Bookingmodel.find({ doctorId: req.body.userId, bookingDate: { $gte: today } }).select("bookingSlot -_id");
    const bookedSlots = [...new Set(booked.map((booking) => booking.bookingSlot))];
    const removedBookedSlots = bookedSlots.filter((slot) => !slots.includes(slot));
    if (removedBookedSlots.length) return res.status(409).json({ msg: `Cannot remove booked time: ${removedBookedSlots.join(", ")}.`, bookedSlots });
    const doctor = await Usermodel.findOneAndUpdate(
        { _id: req.body.userId, role: "doctor" },
        { consultationSlots: slots },
        { new: true, runValidators: true }
    ).select("consultationSlots");
    return res.json({ success: true, consultationSlots: doctor.consultationSlots });
});

// Search doctors by any combination of name, specialty, or location.
userRoute.get("/doctors/search",async(req,res)=>{
    const { name = "", specialty = "", location = "" } = req.query;
    try {
        const filters = [{ role: "doctor" }];
        if (name) filters.push({ name: { "$regex": name, "$options": "i" } });
        if (specialty) filters.push({ specialty: { "$regex": specialty, "$options": "i" } });
        if (location) filters.push({ location: { "$regex": location, "$options": "i" } });
        const doctors = await Usermodel.find({ "$and": filters }).select("-password");
        res.json({ msg: "Matching doctors", data: doctors });
    } catch (error) {
        res.status(500).json({ msg: "Unable to search doctors" });
    }
});

//get doctors according to location
userRoute.get("/doctors/:location",async(req,res)=>{
    let location=req.params.location;
    try {
        let allDoctor=await Usermodel.find({role:"doctor",location:{"$regex":location,"$options":"i"}}).select("-password")
        res.json({"msg":"All doctors details based on location","data":allDoctor})
    } catch (error) {
        console.log("error from getting all doctor route",error);
        res.json({"msg":"error while getting all doctors details based on location"})
    }
})

//get doctors based on their specialty
userRoute.get("/doctors/specialty/:value",async(req,res)=>{
    let specialty=req.params.value;
    console.log(specialty)
    try {
        let allDoctor=await Usermodel.find({role:"doctor",specialty}).select("-password")
        res.json({"msg":"All doctors details based on specialty","data":allDoctor})
    } catch (error) {
        console.log("error from getting all doctor route",error);
        res.json({"msg":"error while getting all doctors details based on specialty"})
    }
})

//Route to add new user(doctor/patient)
userRoute.post("/register",async(req,res)=>{
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = req.body.role;
    const specialty = String(req.body.specialty || "").trim();
    const location = String(req.body.location || "").trim();
    if (!name || !email || !password || !location || !["doctor", "patient"].includes(role) || (role==="doctor" && !specialty)) {
        return res.status(400).json({"msg":"All required fields must be filled."});
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ msg: "Enter a valid email address." });
    if (password.length < 8) return res.status(400).json({ msg: "Password must be at least 8 characters." });
    try {
        const existingUser=await Usermodel.findOne({email});
        if(existingUser){
            return res.status(409).json({"msg":"An account with this email already exists."})
        }
        const hash = await bcrypt.hash(password, 12);
        await Usermodel.create({name,email,password:hash,role,specialty:specialty||"None",location});
        return res.status(201).json({"msg":"Successfully register"});
    } catch (error) {
        console.log("error from register route",error);
        res.status(500).json({"msg":"error in register a user"})
    }
})

//Route to login a user(doctor/patient)
userRoute.post("/login",async(req,res)=>{
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ msg: "Email and password are required." });
    try {
        const user=await Usermodel.findOne({email});
        if(!user) return res.status(401).json({"msg":"Invalid email or password."});
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({"msg":"Invalid email or password."});
        const token=jwt.sign({userId:user._id,role:user.role,email:user.email},process.env.Key, { expiresIn: "7d" });
        return res.json({"msg":"Login Success","token":token,"role":user.role,"name":user.name});

    } catch (error) {
        console.log("error from login route",error);
        res.status(500).json({"msg":"Unable to log in right now."})
    }
})

//Route to logout a user(doctor/patient)
userRoute.get("/logout", (req,res)=>{
    let token=req.headers.authorization;
    if (token && token.startsWith("Bearer ")) token = token.slice(7);
    if (!token) return res.status(400).json({ msg: "No active session found." });
    try {
        const blacklistPath = path.join(__dirname, "../blacklist.json");
        const blacklistdata=JSON.parse(fs.readFileSync(blacklistPath,"utf-8"))
        blacklistdata.push(token)
        fs.writeFileSync(blacklistPath,JSON.stringify(blacklistdata))
        res.json({"msg":"Logout Successful"})
    } catch (error) {
        console.log("error from logout route",error);
        res.json({"msg":"error while logout"})
    }
    
    
 })

module.exports={
    userRoute
}

// {
//     "name":"gunjan kumar",
//     "email":"kumargunjan1116@gmail.com",
//     "password":"",
//     "role":"doctor",
//     "specialty":"Cardiologist",
//     "location":"jamshedpur"
//   }

// {
//     "name":"Manoj Kumar",
//     "email":"manojsfstm5@gmail.com",
//     "password":"",
//     "location":"Patna"
//   }