import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Paper,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import VideoCallOutlinedIcon from "@mui/icons-material/VideoCallOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import axios from "axios";
import { useTranslation } from "react-i18next";

const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "");

const AppointmentPage = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomStatuses, setRoomStatuses] = useState({});
  const [consultationSlots, setConsultationSlots] = useState([]);
  const [newSlot, setNewSlot] = useState("");
  const [savingSlots, setSavingSlots] = useState(false);
  const [slotMessage, setSlotMessage] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [editingSlot, setEditingSlot] = useState("");
  const [editedSlot, setEditedSlot] = useState("");
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();

  const handleUnauthorized = useCallback(() => {
    sessionStorage.clear();
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login", { replace: true });
  }, [navigate]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${baseUrl}/booking/paticularUser`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `${token}`,
        },
      });
      setAppointments(response.data.Data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error.message);
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError("We could not load your appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, token]);

  useEffect(() => {
    if (!token) {
      alert("Login First to Come to this Page");
      navigate("/login");
      return;
    }

    const role = sessionStorage.getItem("role");
    const name = sessionStorage.getItem("name");
    setUserRole(role);
    setUserName(name);

    fetchAppointments();
  }, [token, navigate, fetchAppointments]);

  const fetchAvailability = useCallback(async () => {
    if (sessionStorage.getItem("role") !== "doctor") return;
    try {
      const response = await axios.get(`${baseUrl}/user/doctor/availability`, { headers: { Authorization: `${token}` } });
      setConsultationSlots(response.data.consultationSlots || []);
      setBookedSlots(response.data.bookedSlots || []);
    } catch (availabilityError) {
      console.error("Error fetching consultation times:", availabilityError.message);
      if (availabilityError.response?.status === 401) handleUnauthorized();
    }
  }, [handleUnauthorized, token]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const saveAvailability = async (nextSlots) => {
    setSavingSlots(true);
    setSlotMessage("");
    try {
      const response = await axios.patch(`${baseUrl}/user/doctor/availability`, { consultationSlots: nextSlots }, { headers: { Authorization: `${token}` } });
      setConsultationSlots(response.data.consultationSlots || nextSlots);
      setSlotMessage("Consultation times saved.");
    } catch (availabilityError) {
      if (availabilityError.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setSlotMessage(availabilityError.response?.data?.msg || "Unable to save consultation times.");
    } finally {
      setSavingSlots(false);
    }
  };

  const addSlot = () => {
    const slot = newSlot.trim();
    if (!slot || consultationSlots.includes(slot)) return;
    setNewSlot("");
    saveAvailability([...consultationSlots, slot]);
  };

  const removeSlot = (slot) => {
    if (bookedSlots.includes(slot)) {
      setSlotMessage(`Cannot remove ${slot}; a patient already booked this time.`);
      return;
    }
    if (consultationSlots.length === 1) {
      setSlotMessage("Keep at least one consultation time.");
      return;
    }
    saveAvailability(consultationSlots.filter((item) => item !== slot));
  };

  const startEditingSlot = (slot) => {
    if (bookedSlots.includes(slot)) {
      setSlotMessage("Booked consultation times cannot be edited.");
      return;
    }
    setEditingSlot(slot);
    setEditedSlot(slot);
    setSlotMessage("");
  };

  const saveEditedSlot = () => {
    const nextSlot = editedSlot.trim();
    if (!nextSlot) {
      setSlotMessage("Enter a consultation time.");
      return;
    }
    if (nextSlot !== editingSlot && consultationSlots.includes(nextSlot)) {
      setSlotMessage("That consultation time already exists.");
      return;
    }
    setEditingSlot("");
    setEditedSlot("");
    saveAvailability(consultationSlots.map((slot) => slot === editingSlot ? nextSlot : slot));
  };

  useEffect(() => {
    let cancelled = false;
    const readRoomStatuses = async () => {
      const statuses = {};
      await Promise.all(appointments.map(async (appointment) => {
        try {
          const response = await axios.get(`${baseUrl}/booking/${appointment._id}/room-status`, {
            headers: { Authorization: `${token}` },
          });
          if (response.data.roomStatus) statuses[appointment._id] = response.data.roomStatus;
        } catch (statusError) {
          if (statusError.response?.status === 401) handleUnauthorized();
          // Keep the row available if a status poll is briefly unavailable.
        }
      }));
      if (!cancelled) setRoomStatuses(statuses);
    };
    readRoomStatuses();
    const interval = setInterval(readRoomStatuses, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [appointments, handleUnauthorized, token]);

  const cancelAppointment = async (id) => {
    const confirmed = window.confirm("Cancel this appointment? This action cannot be undone.");
    if (!confirmed) return;
    try {
      const response = await axios.delete(`${baseUrl}/booking/remove/${id}`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `${token}`,
        },
      });

      if (response.data.msg === `booking id of ${id} is deleted succesfully`) {
        alert("Your Booking Successfully Cancelled");
        fetchAppointments();
      } else {
        alert(response.data.msg);
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error.message);
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      alert("Something Went Wrong!!");
    }
  };

  const handleVideoCall = (appointment) => {
    const roomId = appointment.roomId || appointment._id;
    const role = sessionStorage.getItem("role") || "participant";
    localStorage.setItem(`video-room:${roomId}`, JSON.stringify({ status: "waiting", updatedAt: Date.now(), role }));
    window.open(`${baseUrl}/room/${encodeURIComponent(roomId)}?role=${encodeURIComponent(role)}`, "_blank", "noopener,noreferrer");
  };

  const getRoomStatus = (appointment) => roomStatuses[appointment._id]?.status || "idle";
  const isActiveCall = (appointment) => ["joined", "connected"].includes(getRoomStatus(appointment));

  const roomStatusLabel = ({ status = "ready", waitingFor = "doctor and patient" } = {}) => ({
    ready: "Ready to join",
    waiting: `Waiting for ${waitingFor}`,
    joined: "Both joined",
    connected: "In consultation",
    ended: "Call ended",
  }[status] || "Ready to join");

  const formatTimeSlot = (slot) => {
    switch (slot) {
      case "8-9":
        return "8 AM to 9 AM";
      case "9-10":
        return "9 AM to 10 AM";
      case "4-5":
        return "4 PM to 5 PM";
      default:
        return "7 PM to 8 PM";
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        {t('appointment.your_appointments')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {userRole === "doctor" ? "Your scheduled patient consultations" : `Appointments for ${userName || "your account"}`}
      </Typography>
      {userRole === "doctor" && <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}><AccessTimeOutlinedIcon color="primary" /><Typography variant="h6" sx={{ fontWeight: 800 }}>Consultation availability</Typography></Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>Add or remove the times patients can select when booking with you.</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {consultationSlots.map((slot) => <Stack key={slot} direction="row" alignItems="center" spacing={.25}>
            {editingSlot === slot ? <>
              <TextField autoFocus size="small" value={editedSlot} onChange={(event) => setEditedSlot(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveEditedSlot(); if (event.key === "Escape") setEditingSlot(""); }} sx={{ width: 190 }} />
              <Button size="small" onClick={saveEditedSlot} disabled={savingSlots}>Save</Button>
              <Button size="small" color="inherit" onClick={() => setEditingSlot("")}>Cancel</Button>
            </> : <>
              <Tooltip title={bookedSlots.includes(slot) ? "Booked by a patient; cannot change this time" : "Edit this time"}><span><Chip label={bookedSlots.includes(slot) ? `${slot} (booked)` : slot} color="primary" variant="outlined" disabled={bookedSlots.includes(slot)} /></span></Tooltip>
              {!bookedSlots.includes(slot) && <Tooltip title="Edit this time"><IconButton size="small" onClick={() => startEditingSlot(slot)} aria-label={`Edit ${slot}`}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>}
              <Tooltip title={bookedSlots.includes(slot) ? "Booked by a patient; cannot remove this time" : "Remove this time"}><span><IconButton size="small" color="error" onClick={() => removeSlot(slot)} disabled={bookedSlots.includes(slot)} aria-label={`Remove ${slot}`}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
            </>}
          </Stack>)}
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField size="small" label="New time (e.g. 10 AM - 11 AM)" value={newSlot} onChange={(event) => setNewSlot(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSlot(); } }} sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={addSlot} disabled={!newSlot.trim() || savingSlots}>Add time</Button>
        </Stack>
        {slotMessage && <Typography variant="body2" color={slotMessage.includes("saved") ? "success.main" : "error.main"} sx={{ mt: 1.5 }}>{slotMessage}</Typography>}
      </Paper>}
      {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchAppointments}>Retry</Button>} sx={{ mb: 3 }}>{error}</Alert>}
      {loading ? <Box sx={{ display: "grid", placeItems: "center", py: 10 }}><CircularProgress /></Box> : appointments.length === 0 ? <Box sx={{ textAlign: "center", py: 10, border: 1, borderColor: "divider", borderRadius: 2 }}><EventAvailableOutlinedIcon color="primary" sx={{ fontSize: 48 }} /><Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>{t('appointment.no_appointments')}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{userRole === "patient" ? "Book a doctor to see your upcoming consultations here." : "New patient bookings will appear here."}</Typography></Box> : <TableContainer component={Paper} sx={{ border: 1, borderColor: "divider", boxShadow: 1, overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SI NO.</TableCell>
              <TableCell>Participant</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time Slot</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appointment, index) => (
              <TableRow key={appointment._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{userRole === "doctor" ? appointment.userEmail : "Doctor consultation"}</TableCell>
                <TableCell>{appointment.bookingDate}</TableCell>
                <TableCell>{formatTimeSlot(appointment.bookingSlot)}</TableCell>
                <TableCell><Chip icon={<VideoCallOutlinedIcon />} size="small" label={roomStatusLabel(roomStatuses[appointment._id])} color={getRoomStatus(appointment) === "connected" ? "success" : ["waiting", "joined"].includes(getRoomStatus(appointment)) ? "warning" : "default"} /></TableCell>
                <TableCell>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                    {isActiveCall(appointment) ? <Chip icon={<VideoCallOutlinedIcon />} color="success" variant="outlined" label="In consultation" sx={{ alignSelf: "center" }} /> : <Button variant="contained" startIcon={<VideoCallOutlinedIcon />} onClick={() => handleVideoCall(appointment)}>{getRoomStatus(appointment) === "waiting" ? "Open waiting room" : "Video call"}</Button>}
                    {userRole === "patient" ? <Button variant="outlined" color="error" onClick={() => cancelAppointment(appointment._id)}>Cancel</Button> : <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center", whiteSpace: "nowrap" }}>Managed by patient</Typography>}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>}
    </Box>
  );
};

export default AppointmentPage;
