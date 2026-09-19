import React, { useState } from "react";
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MedicalInformationOutlinedIcon from "@mui/icons-material/MedicalInformationOutlined";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const RegisterPage = () => {
  const { t } = useTranslation();
  const [role, setRole] = useState("patient");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    password: "",
    confirmPassword: "",
    specialty: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const data = {
      ...formData,
      role: role === "doctor" ? "doctor" : "patient",
    };

    // Basic validation
    if (
      !data.name ||
      !data.email ||
      !data.location ||
      !data.password ||
      (role === "doctor" && !data.specialty)
    ) {
      setError("Please fill all required fields.");
      return;
    }
    if (data.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      let out = {};
      try {
        out = await res.json();
      } catch (jsonErr) {
        setError("Server error: Invalid response from backend.");
        console.error("Invalid JSON from backend", jsonErr);
        return;
      }
      if (out.msg === "Successfully register") {
        setSuccess("Registration successful! Redirecting to login...");
        setFormData({
          name: "",
          email: "",
          location: "",
          password: "",
          confirmPassword: "",
          specialty: "",
        });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(out.msg || "Registration failed.");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Error while registering");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)", p: { xs: 2, md: 5 }, bgcolor: "background.default" }}>
      <Paper elevation={0} sx={{ maxWidth: 920, mx: "auto", p: { xs: 3, md: 5 }, border: 1, borderColor: "divider" }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <MedicalInformationOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
          <Box><Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>Create your profile</Typography><Typography variant="h4" sx={{ fontWeight: 800 }}>{t("register.title")}</Typography></Box>
        </Stack>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Choose your role to get the right healthcare workspace.</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
          {[{ value: "patient", title: "Patient", text: "Find doctors and book consultations." }, { value: "doctor", title: "Doctor", text: "Manage appointments and consultations." }].map((item) => (
            <Button key={item.value} variant={role === item.value ? "contained" : "outlined"} onClick={() => setRole(item.value)} sx={{ flex: 1, justifyContent: "flex-start", textAlign: "left", p: 1.5, textTransform: "none" }}>
              <Box><Typography sx={{ fontWeight: 800 }}>{item.title}</Typography><Typography variant="caption" sx={{ display: "block", opacity: .8 }}>{item.text}</Typography></Box>
            </Button>
          ))}
        </Stack>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          {success && <Alert severity="success">{success}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label={t("register.name")} name="name" value={formData.name} onChange={handleChange} required inputProps={{ minLength: 2 }} />
          <TextField label={t("register.email")} name="email" type="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
          <TextField label="Location" name="location" value={formData.location} onChange={handleChange} required />
          {role === "doctor" && (
            <FormControl fullWidth required>
              <InputLabel>Specialty</InputLabel>
              <Select name="specialty" value={formData.specialty} onChange={handleChange} label="Specialty">
              <MenuItem value="">--Select Speciality--</MenuItem>
              <MenuItem value="Pediatrician">Pediatrician</MenuItem>
              <MenuItem value="Gynecologist">Gynecologist</MenuItem>
              <MenuItem value="Cardiologist">Cardiologist</MenuItem>
              <MenuItem value="Oncologist">Oncologist</MenuItem>
              <MenuItem value="Gastroenterologist">Gastroenterologist</MenuItem>
              <MenuItem value="Pulmonologist">Pulmonologist</MenuItem>
              <MenuItem value="Infectious disease">Infectious Disease</MenuItem>
              <MenuItem value="Nephrologist">Nephrologist</MenuItem>
              <MenuItem value="Endocrinologist">Endocrinologist</MenuItem>
              <MenuItem value="Ophthalmologist">Ophthalmologist</MenuItem>
              <MenuItem value="Dermatologist">Dermatologist</MenuItem>
              <MenuItem value="Psychiatrist">Psychiatrist</MenuItem>
              <MenuItem value="Neurologist">Neurologist</MenuItem>
              <MenuItem value="Radiologist">Radiologist</MenuItem>
              <MenuItem value="Surgeon">Surgeon</MenuItem>
              <MenuItem value="Physician">Physician</MenuItem>

              {/* Add more specialties as needed */}
              </Select>
            </FormControl>
          )}
          <TextField label={t("register.password")} name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required helperText="Use at least 8 characters." autoComplete="new-password"
            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword((value) => !value)} edge="end" aria-label="toggle password visibility">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
          <TextField label="Confirm password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} required autoComplete="new-password"
            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirmPassword((value) => !value)} edge="end" aria-label="toggle password visibility">{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
          <Button type="submit" variant="contained" color="primary" size="large" disabled={loading} sx={{ py: 1.4 }}>{loading ? <CircularProgress size={24} color="inherit" /> : t("register.submit")}</Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
