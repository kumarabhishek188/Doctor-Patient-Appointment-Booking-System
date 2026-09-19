import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import axios from "axios";
import { useTranslation } from "react-i18next";

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const obj = { email, password };
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`/user/login`, obj, {
        headers: { "Content-Type": "application/json" },
      });
      const { token, role, name, msg } = res.data;
      if (msg === "Login Success") {
        setSuccess("Login successful! Redirecting...");
        setEmail("");
        setPassword("");
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("name", name);
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          sessionStorage.setItem("userId", payload.userId);
        } catch {
          setError("Login response was invalid. Please try again.");
          return;
        }
        setTimeout(() => {
          navigate(role === "doctor" ? "/appointments" : "/doctors");
        }, 1200);
      } else {
        setError(msg || "Login failed.");
      }
    } catch (err) {
      setError(
        err.response?.data?.msg || "An error occurred while logging in."
      );
      console.error("Error during login:", err.response || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)", display: "grid", placeItems: "center", p: { xs: 2, md: 5 }, bgcolor: "background.default" }}>
      <Paper elevation={0} sx={{ width: "100%", maxWidth: 980, display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" }, overflow: "hidden", border: 1, borderColor: "divider" }}>
        <Box sx={{ p: { xs: 3, md: 5 }, bgcolor: "primary.main", color: "primary.contrastText", display: { xs: "none", md: "block" } }}>
          <HealthAndSafetyOutlinedIcon sx={{ fontSize: 48 }} />
          <Typography variant="h3" sx={{ mt: 5, fontWeight: 800, lineHeight: 1.1 }}>Care that follows through.</Typography>
          <Typography sx={{ mt: 2, opacity: .85, lineHeight: 1.7 }}>Manage appointments, join consultations, and stay connected with your care team.</Typography>
        </Box>
        <Box sx={{ p: { xs: 3, md: 6 } }}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>Secure access</Typography>
          <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>{t('login.title')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Sign in to continue to your healthcare workspace.</Typography>
          <Stack spacing={2} component="form" onSubmit={handleSubmit}>
            {success && <Alert severity="success">{success}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label={t('login.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <TextField label={t('login.password')} type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword((value) => !value)} edge="end" aria-label="toggle password visibility">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
            <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.4 }}>{loading ? <CircularProgress size={24} color="inherit" /> : t('login.submit')}</Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
