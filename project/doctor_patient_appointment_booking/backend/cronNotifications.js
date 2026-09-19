// This script checks for upcoming appointments and creates in-app notifications for users
const { Bookingmodel } = require("./models/bookingModel");
const { NotificationModel } = require("./models/notificationModel");
const mongoose = require("mongoose");
require("dotenv").config();
const cron = require("node-cron");

// Connect to DB if not already connected
mongoose.connect(process.env.mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const slotHours = { "8-9": 8, "9-10": 9, "4-5": 16, "7-8": 19 };

function appointmentDateTime(bookingDate, bookingSlot) {
  const [year, month, day] = bookingDate.split("-").map(Number);
  return new Date(year, month - 1, day, slotHours[bookingSlot] || 9, 0, 0);
}

// Run every minute so reminders stay close to the scheduled time.
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const upcoming = await Bookingmodel.find({
    bookingDate: { $gte: now.toISOString().slice(0, 10) },
  });
  for (const appt of upcoming) {
    const apptDate = appointmentDateTime(appt.bookingDate, appt.bookingSlot);
    const appointmentMessage = `Your appointment on ${appt.bookingDate} at ${appt.bookingSlot} starts in about one hour.`;
    if (apptDate > now && apptDate <= inOneHour) {
      for (const userId of [appt.userId, appt.doctorId]) {
        const exists = await NotificationModel.findOne({ userId, message: appointmentMessage });
        if (!exists) await NotificationModel.create({ userId, message: appointmentMessage });
      }
    }
    const diffMs = apptDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 23.5 / 24 && diffDays < 24.5 / 24) {
      const tomorrowMessage = `Reminder: your appointment tomorrow (${appt.bookingDate}) is at ${appt.bookingSlot}.`;
      for (const userId of [appt.userId, appt.doctorId]) {
        const existsDay = await NotificationModel.findOne({ userId, message: tomorrowMessage });
        if (!existsDay) await NotificationModel.create({ userId, message: tomorrowMessage });
      }
    }
  }
});
