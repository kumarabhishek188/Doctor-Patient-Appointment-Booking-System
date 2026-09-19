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
} from "@mui/material";
import axios from "axios";
import { useTranslation } from "react-i18next";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

const AppointmentPage = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();

  const fetchAppointments = useCallback(async () => {
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
    }
  }, [token]);

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

  const cancelAppointment = async (id) => {
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
      alert("Something Went Wrong!!");
    }
  };

  const handleVideoCall = (appointment) => {
    const roomId = appointment.roomId || appointment._id;
    const role = sessionStorage.getItem("role") || "participant";
    window.open(`${baseUrl}/${encodeURIComponent(roomId)}?role=${encodeURIComponent(role)}`, "_blank", "noopener,noreferrer");
  };

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
    <div>
      <Typography variant="h4" align="center" sx={{ mt: 4, mb: 2 }}>
        {t('appointment.your_appointments')}
      </Typography>
      <Typography variant="h5" align="center" gutterBottom>
        All Bookings of {userRole} {userName}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SI NO.</TableCell>
              <TableCell>Patient Email</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time Slot</TableCell>
              <TableCell>Cancel Appointment</TableCell>
              <TableCell>Video Call</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appointment, index) => (
              <TableRow key={appointment._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{appointment.userEmail}</TableCell>
                <TableCell>{appointment.bookingDate}</TableCell>
                <TableCell>{formatTimeSlot(appointment.bookingSlot)}</TableCell>
                <TableCell>
                  {userRole === "patient" ? (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => cancelAppointment(appointment._id)}
                    >
                      Cancel Appointment
                    </Button>
                  ) : (
                    <Typography color="text.secondary">Managed by patient</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleVideoCall(appointment)}
                  >
                    Video Call
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AppointmentPage;
