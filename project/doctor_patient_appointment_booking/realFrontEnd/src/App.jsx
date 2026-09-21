import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Chip, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import VideoCameraFrontOutlinedIcon from '@mui/icons-material/VideoCameraFrontOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Link as RouterLink } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import RegisterPage from "./pages/RegisterPage";
import Doctor from "./pages/Doctor";
import AppointmentPage from "./pages/AppointmentPage";
import BookAppointment from "./pages/BookAppointment"; // new component

const HomePage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isLoggedIn = Boolean(sessionStorage.getItem('token'));
  const role = sessionStorage.getItem('role');
  const primaryPath = role === 'doctor' ? '/appointments' : role === 'patient' ? '/doctors' : '/register';

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: 'calc(100vh - 64px)', color: 'text.primary' }}>
      <Box sx={{ background: isDark ? '#102a43' : '#eaf5f4', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label={t('home.eyebrow')} color="primary" sx={{ mb: 2, fontWeight: 700 }} />
              <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '4.4rem' }, lineHeight: 1.05, fontWeight: 800, maxWidth: 720 }}>
                {t('home.welcome')}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2, maxWidth: 600, lineHeight: 1.6 }}>
                {t('home.subtitle')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                <Button component={RouterLink} to={primaryPath} variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />}>
                  {isLoggedIn ? t('home.open_dashboard') : t('home.get_started')}
                </Button>
                {!isLoggedIn && <Button component={RouterLink} to="/login" variant="outlined" size="large">{t('navbar.login')}</Button>}
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>{t('home.today_label')}</Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 800 }}>{t('home.care_title')}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>{t('home.care_text')}</Typography>
                <Stack spacing={2} sx={{ mt: 3 }}>
                  <TrustRow icon={<CalendarMonthOutlinedIcon />} text={t('home.trust_booking')} />
                  <TrustRow icon={<VideoCameraFrontOutlinedIcon />} text={t('home.trust_video')} />
                  <TrustRow icon={<NotificationsNoneOutlinedIcon />} text={t('home.trust_reminders')} />
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 7 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('home.features_title')}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>{t('home.features_subtitle')}</Typography>
        <Grid container spacing={2}>
          <FeatureCard icon={<CalendarMonthOutlinedIcon />} title={t('home.feature_booking')} desc={t('home.feature_booking_desc')} />
          <FeatureCard icon={<VideoCameraFrontOutlinedIcon />} title={t('home.feature_video')} desc={t('home.feature_video_desc')} />
          <FeatureCard icon={<SearchOutlinedIcon />} title={t('home.feature_directory')} desc={t('home.feature_directory_desc')} />
          <FeatureCard icon={<NotificationsNoneOutlinedIcon />} title={t('home.feature_alerts')} desc={t('home.feature_alerts_desc')} />
        </Grid>
      </Container>
    </Box>
  );
};

const TrustRow = ({ icon, text }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{text}</Typography>
  </Stack>
);

const FeatureCard = ({ title, icon, desc }) => (
  <Grid item xs={12} sm={6} md={3}>
    <Paper sx={{ p: 2.5, height: '100%', border: 1, borderColor: 'divider', transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
      <Box sx={{ color: 'primary.main', display: 'flex', mb: 2 }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>{desc}</Typography>
    </Paper>
  </Grid>
);

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/doctors" element={<Doctor />} />
        <Route path="/appointments" element={<AppointmentPage />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
      </Routes>
    </Router>
  );
};

export default App;
