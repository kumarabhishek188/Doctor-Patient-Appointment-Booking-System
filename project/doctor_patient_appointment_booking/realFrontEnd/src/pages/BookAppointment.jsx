// src/pages/BookAppointment.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Chip,
  TextField,
  Typography,
  Alert,
  Paper,
  Stack,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BookAppointment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [minDate, setMinDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [checkingBookedSlots, setCheckingBookedSlots] = useState(false);

  // Set the minimum date (tomorrow)
  useEffect(() => {
    const loadDoctorAvailability = async () => {
      try {
        const storedDoctor = sessionStorage.getItem("selectedDoctor");
        const parsedDoctor = storedDoctor ? JSON.parse(storedDoctor) : null;
        if (parsedDoctor) {
          setSelectedDoctor(parsedDoctor);
          setAvailableSlots(parsedDoctor.consultationSlots || []);
        }
        const doctorId = sessionStorage.getItem("doctorId");
        if (doctorId) {
          const response = await axios.get(`/user/doctors/id/${doctorId}`);
          setSelectedDoctor(response.data.data);
          setAvailableSlots(response.data.data.consultationSlots || []);
          setBookedSlots(response.data.data.bookedSlots || []);
        }
      } catch {
        if (!sessionStorage.getItem("selectedDoctor")) sessionStorage.removeItem("selectedDoctor");
      } finally {
        setLoadingSlots(false);
      }
    };
    loadDoctorAvailability();

    const dtToday = new Date();
    const tomorrow = new Date(dtToday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
    const day = tomorrow.getDate().toString().padStart(2, "0");
    setMinDate(`${year}-${month}-${day}`);
  }, []);

  useEffect(() => {
    const doctorId = sessionStorage.getItem("doctorId");
    if (!doctorId || !bookingDate) {
      setBookedSlots([]);
      return;
    }
    let active = true;
    const checkBookedSlots = async () => {
      setCheckingBookedSlots(true);
      try {
        const response = await axios.get(`/user/doctors/id/${doctorId}?date=${encodeURIComponent(bookingDate)}`);
        if (!active) return;
        const nextBookedSlots = response.data.data.bookedSlots || [];
        setBookedSlots(nextBookedSlots);
        setBookingSlot((currentSlot) => nextBookedSlots.includes(currentSlot) ? "" : currentSlot);
      } catch (availabilityError) {
        if (active) setError(availabilityError.response?.data?.msg || "Unable to check this date's availability.");
      } finally {
        if (active) setCheckingBookedSlots(false);
      }
    };
    checkBookedSlots();
    return () => { active = false; };
  }, [bookingDate]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = sessionStorage.getItem("token");
    const doctorId = sessionStorage.getItem("doctorId");

    if (!token) {
      alert("Please login first to book an appointment!!");
      navigate("/login");
      return;
    }

    if (!doctorId) {
      setError("Please choose a doctor before booking an appointment.");
      navigate("/doctors");
      return;
    }

    if (!bookingDate || !bookingSlot) {
      setError("Please fill all the fields.");
      return;
    }

    const appointmentObj = {
      doctorId,
      bookingDate,
      bookingSlot,
    };

    setSubmitting(true);
    try {
      const res = await axios.post(`/booking/create`, appointmentObj, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const out = res.data;
      if (out.success) {
        setSuccess(
          `Hi, your booking is confirmed on ${bookingDate} and a confirmation email has been sent to your registered email.`
        );
        setBookingDate("");
        setBookingSlot("");
        setTimeout(() => navigate("/appointments"), 1500);
      } else {
        setError(out.msg);
      }
    } catch (error) {
      setError(error.response?.data?.msg || "Something went wrong booking an appointment!");
      console.error("Error booking an appointment:", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 680, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 6 } }}>
      <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>Secure appointment booking</Typography>
      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>
        {t("doctor.book_appointment")}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Choose a convenient date and consultation time. Your doctor will receive the confirmation immediately.</Typography>
      {selectedDoctor && <Paper elevation={0} sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, mb: 2, border: 1, borderColor: "primary.light", borderRadius: 2, bgcolor: "action.hover" }}>
        <Box sx={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText" }}><LocalHospitalOutlinedIcon /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" color="text.secondary">Booking with</Typography><Typography sx={{ fontWeight: 800 }} noWrap>{selectedDoctor.name}</Typography><Typography variant="body2" color="text.secondary" noWrap>{selectedDoctor.specialty} {selectedDoctor.location ? `• ${selectedDoctor.location}` : ""}</Typography></Box>
        <Chip label="Selected" color="primary" size="small" />
      </Paper>}
      <Paper component="form" onSubmit={handleBooking} elevation={0} sx={{ p: { xs: 2, md: 4 }, border: 1, borderColor: "divider", borderRadius: 2 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack spacing={2.5}>
        <TextField
          label="Appointment date"
          type="date"
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: minDate }}
          fullWidth
          value={bookingDate}
          onChange={(e) => setBookingDate(e.target.value)}
          required
          InputProps={{ startAdornment: <CalendarMonthOutlinedIcon color="action" sx={{ mr: 1 }} /> }}
        />
          <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}><AccessTimeOutlinedIcon color="primary" /><Typography sx={{ fontWeight: 800 }}>Choose a consultation time</Typography></Stack>
          {loadingSlots ? <CircularProgress size={24} /> : availableSlots.length === 0 ? <Alert severity="info">This doctor has not published any consultation times yet.</Alert> : <>
            {bookingDate && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{checkingBookedSlots ? "Checking availability..." : bookedSlots.length ? "Dark slots are already booked for this date." : "All published times are available for this date."}</Typography>}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            {availableSlots.map((slot) => {
              const isBooked = bookedSlots.includes(slot);
              return <Button key={slot} type="button" disabled={isBooked || checkingBookedSlots} variant={bookingSlot === slot ? "contained" : "outlined"} onClick={() => setBookingSlot(slot)} sx={{ justifyContent: "flex-start", py: 1.5, px: 2, textAlign: "left", ...(isBooked && { bgcolor: "#263238", color: "#fff", borderColor: "#263238", opacity: 1, cursor: "not-allowed", "&.Mui-disabled": { bgcolor: "#263238", color: "#fff", borderColor: "#263238" } }) }}>{isBooked ? `${slot} • BOOKED` : slot}</Button>;
            })}
            </Box>
          </>}
        </Box>
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={submitting} sx={{ py: 1.4, fontWeight: 800 }}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : "Confirm appointment"}
        </Button>
      </Stack>
      </Paper>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/doctors")} sx={{ mt: 2 }}>Back to doctors</Button>
    </Box>
  );
};

export default BookAppointment;
