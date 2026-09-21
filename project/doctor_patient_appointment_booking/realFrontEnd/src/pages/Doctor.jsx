import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Chip,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Container,
  InputAdornment,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "");

const Doctor = () => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("role") === "doctor") {
      navigate("/appointments", { replace: true });
      return;
    }
    fetchAllDoctors();
  }, [navigate]);

  const fetchAllDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${baseUrl}/user/doctors`);
      if (!res.ok) throw new Error("Unable to load doctors");
      const data = await res.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setError("We could not load the doctor directory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const searchDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ name, specialty, location });
      const res = await fetch(`${baseUrl}/user/doctors/search?${params}`);
      if (!res.ok) throw new Error("Unable to search doctors");
      const data = await res.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error("Error fetching doctors by location:", error);
      setError("Search is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchDoctors();
  };

  const resetSearch = () => {
    setName("");
    setLocation("");
    setSpecialty("");
    fetchAllDoctors();
  };

  const handleSpecialtyChange = (e) => {
    const selectedSpecialty = e.target.value;
    setSpecialty(selectedSpecialty);
  };

  const handleBookAppointment = (doctorId) => {
    sessionStorage.setItem("doctorId", doctorId);
    const selectedDoctor = doctors.find((doctor) => doctor._id === doctorId);
    if (selectedDoctor) sessionStorage.setItem("selectedDoctor", JSON.stringify(selectedDoctor));
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        {t('doctor.title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Find the right clinician by name, specialty, or location.</Typography>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); handleSearch(); }} sx={{ p: { xs: 2, md: 3 }, mb: 4, border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
        <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            label={t('doctor.find_by_name', 'Search by doctor name')}
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon color="action" /></InputAdornment> }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label={t('doctor.find_by_location', 'Find doctors by location')}
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnOutlinedIcon color="action" /></InputAdornment> }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>{t('doctor.specialty', 'Specialty')}</InputLabel>
            <Select value={specialty} onChange={handleSpecialtyChange} label={t('doctor.specialty', 'Specialty')}>
              <MenuItem value="">{t('doctor.select_specialty', 'All specialties')}</MenuItem>
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
        <Grid item xs={12} md={2}>
          <Button type="submit" variant="contained" fullWidth sx={{ height: 56 }}>
            {t('doctor.search', 'Search')}
          </Button>
        </Grid>
        <Grid item xs={12} md={12} sx={{ display: "flex", justifyContent: { xs: "stretch", md: "flex-end" } }}>
          <Button type="button" color="inherit" startIcon={<RestartAltOutlinedIcon />} onClick={resetSearch}>{t('doctor.reset', 'Reset filters')}</Button>
        </Grid>
        </Grid>
      </Box>
      {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchAllDoctors}>Retry</Button>} sx={{ mb: 3 }}>{error}</Alert>}
      {loading ? <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box> : doctors.length === 0 ? <Box sx={{ textAlign: "center", py: 8, border: 1, borderColor: "divider", borderRadius: 2 }}><Typography variant="h6" sx={{ fontWeight: 700 }}>{t('doctor.no_results', 'No doctors found')}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Try a different search or reset your filters.</Typography></Box> : (
      <Grid container spacing={2}>
        {doctors.map((doctor) => (
          <Grid item xs={12} sm={6} md={4} key={doctor._id}>
            <Card
              sx={{
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  background: (theme) => theme.palette.mode === 'dark' ? '#23272a' : '#e3f2fd',
                },
                borderRadius: 2,
                boxShadow: 1,
                minHeight: 210,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Chip label={doctor.specialty || t('doctor.specialty', 'Specialist')} color="primary" variant="outlined" size="small" sx={{ mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  {doctor.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{doctor.email}</Typography>
                <Typography variant="body2" color="text.secondary">{doctor.location || "Location not provided"}</Typography>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => handleBookAppointment(doctor._id)}
                  component={RouterLink}
                  to="/book-appointment"
                  sx={{
                    fontWeight: 600,
                    borderRadius: 1.5,
                    py: 1,
                  }}
                >
                  {t('doctor.book_appointment', 'Book Appointment')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      )}
    </Container>
  );
};

export default Doctor;
