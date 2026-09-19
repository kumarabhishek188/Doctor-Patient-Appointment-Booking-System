import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Container,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const baseUrl = "http://localhost:4000";

const Doctor = () => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("role") === "doctor") {
      navigate("/appointments", { replace: true });
      return;
    }
    fetchAllDoctors();
  }, [navigate]);

  const fetchAllDoctors = async () => {
    try {
      const res = await fetch(`${baseUrl}/user/doctors`);
      const data = await res.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const searchDoctors = async () => {
    try {
      const params = new URLSearchParams({ name, specialty, location });
      const res = await fetch(`${baseUrl}/user/doctors/search?${params}`);
      const data = await res.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error("Error fetching doctors by location:", error);
    }
  };

  const handleSearch = () => {
    searchDoctors();
  };

  const handleSpecialtyChange = (e) => {
    const selectedSpecialty = e.target.value;
    setSpecialty(selectedSpecialty);
  };

  const handleBookAppointment = (doctorId) => {
    sessionStorage.setItem("doctorId", doctorId);
  };

  return (
    <Container>
      <Typography variant="h4" align="center" gutterBottom>
        {t('doctor.title')}
      </Typography>
      <Grid container spacing={2} alignItems="center" marginBottom={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label={t('doctor.find_by_name', 'Search by doctor name')}
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label={t('doctor.find_by_location', 'Find doctors by location')}
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button variant="contained" fullWidth onClick={handleSearch}>
            {t('doctor.search', 'Search')}
          </Button>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>{t('doctor.specialty', 'Specialty')}</InputLabel>
            <Select value={specialty} onChange={handleSpecialtyChange} label={t('doctor.specialty', 'Specialty')}>
              <MenuItem value="">--{t('doctor.select_specialty', 'Select Specialty')}--</MenuItem>
              <MenuItem value="Pediatrician">{t('doctor.pediatrician', 'Pediatrician')}</MenuItem>
              <MenuItem value="Obstetricians">{t('doctor.gynecologist', 'Gynecologist')}</MenuItem>
              <MenuItem value="Cardiologist">{t('doctor.cardiologist', 'Cardiologist')}</MenuItem>
              <MenuItem value="Oncologist">{t('doctor.oncologist', 'Oncologist')}</MenuItem>
              <MenuItem value="Gastroenterologist">{t('doctor.gastroenterologist', 'Gastroenterologist')}</MenuItem>
              <MenuItem value="Pulmonologist">{t('doctor.pulmonologist', 'Pulmonologist')}</MenuItem>
              <MenuItem value="Infectious disease">{t('doctor.infectious_disease', 'Infectious Disease')}</MenuItem>
              <MenuItem value="Nephrologist">{t('doctor.nephrologist', 'Nephrologist')}</MenuItem>
              <MenuItem value="Endocrinologist">{t('doctor.endocrinologist', 'Endocrinologist')}</MenuItem>
              <MenuItem value="Ophthalmologist">{t('doctor.ophthalmologist', 'Ophthalmologist')}</MenuItem>
              <MenuItem value="Dermatologist">{t('doctor.dermatologist', 'Dermatologist')}</MenuItem>
              <MenuItem value="Psychiatrist">{t('doctor.psychiatrist', 'Psychiatrist')}</MenuItem>
              <MenuItem value="Neurologist">{t('doctor.neurologist', 'Neurologist')}</MenuItem>
              <MenuItem value="Radiologist">{t('doctor.radiologist', 'Radiologist')}</MenuItem>
              <MenuItem value="Surgeon">{t('doctor.surgeon', 'Surgeon')}</MenuItem>
              <MenuItem value="Physician">{t('doctor.physician', 'Physician')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {doctors.map((doctor) => (
          <Grid item xs={12} sm={6} md={4} key={doctor._id}>
            <Card
              sx={{
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.03)',
                  boxShadow: 6,
                  background: (theme) => theme.palette.mode === 'dark' ? '#23272a' : '#e3f2fd',
                },
                borderRadius: 3,
                boxShadow: 3,
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('doctor.name', 'Name')}: {doctor.name}
                </Typography>
                <Typography sx={{ mb: 0.5 }}>{t('doctor.email', 'Email')}: {doctor.email}</Typography>
                <Typography sx={{ mb: 0.5 }}>{t('doctor.location', 'Location')}: {doctor.location}</Typography>
                <Typography sx={{ mb: 2 }}>{t('doctor.specialty', 'Specialty')}: {doctor.specialty}</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => handleBookAppointment(doctor._id)}
                  component={RouterLink}
                  to="/book-appointment"
                  sx={{
                    fontWeight: 600,
                    borderRadius: 2,
                    py: 1.2,
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                    boxShadow: 2,
                    '&:hover': {
                      background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                    },
                  }}
                >
                  {t('doctor.book_appointment', 'Book Appointment')}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Doctor;
