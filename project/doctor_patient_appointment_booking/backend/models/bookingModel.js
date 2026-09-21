const mongoose=require("mongoose");
const crypto=require("crypto");

const bookingSchema=mongoose.Schema({
    userId:{type:String,require:true},
    doctorId:{type:String,require:true},
    userEmail:{type:String,require:true},
    bookingDate:{type:String,require:true},
    bookingSlot:{type:String,require:true},
    roomId:{type:String,required:true,unique:true,default:()=>crypto.randomUUID()}
},{timestamps:true})

bookingSchema.index({ doctorId: 1, bookingDate: 1, bookingSlot: 1 }, { unique: true });

const Bookingmodel=mongoose.model("booking",bookingSchema)

module.exports={Bookingmodel}