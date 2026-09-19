const express = require("express");
const { Bookingmodel } = require("../models/bookingModel");
const { authentication } = require("../middlewares/authenticationMiddleware");
const {authorisation}=require("../middlewares/authorizationMiddleware");
const { NotificationModel } = require("../models/notificationModel");
const bookingRoutes = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config()

//getting paticular user booking data
bookingRoutes.get("/paticularUser", authentication,authorisation(["patient","doctor"]),async (req, res) => {
    let userId = req.body.userId;
    let role=req.body.role;
    
    try {
        if(role==="patient"){
            const reqData = await Bookingmodel.find({ userId });
            res.json({" msg": `All booking data of userId ${userId}`, "Data": reqData })
        }else{
            const reqData = await Bookingmodel.find({ doctorId:userId });
            res.json({" msg": `All booking data of userId ${userId}`, "Data": reqData })
        }
        
    } catch (error) {
        console.log("error from getting paticular user booking data", error.message);
        res.json({ "msg": "error in getting paticular user booking data", "errorMsg": error.message })
    }
})


// Create new booking without sending an email confirmation
bookingRoutes.post(
  "/create",
  authentication,
  authorisation(["patient"]),
  async (req, res) => {
    const data = req.body;
    if (!data.doctorId || !data.bookingDate || !data.bookingSlot || !data.userId || !data.userEmail) {
      return res.status(400).json({ success: false, msg: "All required fields must be filled." });
    }
    try {
      let allBookings = await Bookingmodel.find({ doctorId: data.doctorId });
      let booking;
      if (allBookings.length === 0) {
        const addData = new Bookingmodel(data);
        booking = await addData.save();
      } else {
        for (let i = 0; i < allBookings.length; i++) {
          if (
            allBookings[i].bookingDate === data.bookingDate &&
            allBookings[i].bookingSlot === data.bookingSlot
          ) {
            return res.status(409).json({
              success: false,
              msg: "This Slot is Not Available.",
            });
          }
        }
        const addData = new Bookingmodel(data);
        booking = await addData.save();
      }
      const appointmentMessage = `New appointment scheduled for ${data.bookingDate} at ${data.bookingSlot}.`;
      await NotificationModel.create([
        { userId: data.userId, message: `Your appointment is confirmed for ${data.bookingDate} at ${data.bookingSlot}.` },
        { userId: data.doctorId, message: appointmentMessage },
      ]);

      return res.status(201).json({
        success: true,
        msg: "Booking confirmed",
        bookingDate: data.bookingDate,
        booking,
      });
    } catch (error) {
      console.log("error from adding new booking data", error.message);
      res.status(500).json({
        success: false,
        msg: "error in adding new booking data",
        errorMsg: error.message,
      });
    }
  }
);

// Return the stable room id for a booking to either participant.
bookingRoutes.get("/:id/room", authentication, authorisation(["patient", "doctor"]), async (req, res) => {
  try {
    const booking = await Bookingmodel.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, msg: "Appointment not found." });

    const isParticipant = booking.userId === req.body.userId || booking.doctorId === req.body.userId;
    if (!isParticipant) return res.status(403).json({ success: false, msg: "You are not part of this appointment." });

    const roomId = booking.roomId || booking._id.toString();
    return res.json({ success: true, roomId });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "Unable to open the video room." });
  }
});

//removing the booking data
bookingRoutes.delete("/remove/:id", authentication,authorisation(["patient"]),async (req, res) => {
    const ID = req.params.id
    //console.log(ID);

    try {
        let reqData=await Bookingmodel.find({_id:ID});
        let specificDate = new Date(`${reqData[0].bookingDate}`);
        let currentDate = new Date();
        if(currentDate>specificDate){
            return res.json({"msg":"Meeting Already Over"})
        }else{
            let timeDiff = Math.abs(currentDate.getTime() - specificDate.getTime());
            let daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            if(daysDiff>=1){
                await Bookingmodel.findByIdAndDelete({ _id: ID });
                res.json({ "msg": `booking id of ${ID} is deleted succesfully` })
            }else{
                return res.json({"msg":"Our cancellation policy requires a minimum one-day notice for booking deletions."})
            }
            
        }
        
    } catch (error) {
        console.log("error from deleting booking data", error.message);
        res.json({ "msg": "error in deleting of booking data", "errorMsg": error.message })
    }
})

module.exports = {
    bookingRoutes
}
