import React, { useState, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Button, Switch, Tooltip, Select, MenuItem, Box } from "@mui/material";
import Notifications from "./Notifications";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTranslation } from 'react-i18next';

// Theme context for dark mode
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

const Navbar = () => {
  const { mode, toggleColorMode } = useColorMode();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem('language') || i18n.language || 'en');
  const role = sessionStorage.getItem("role");

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const handleLangChange = (event) => {
    const newLang = event.target.value;
    setLang(newLang);
    localStorage.setItem('language', newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Button component={Link} to="/" color="inherit" key={location.pathname}>{t('navbar.home')}</Button>
        {!role && <Button component={Link} to="/register" color="inherit">{t('navbar.register')}</Button>}
        {!role && <Button component={Link} to="/login" color="inherit">{t('navbar.login')}</Button>}
        {role === "patient" && <Button component={Link} to="/doctors" color="inherit">{t('navbar.doctors')}</Button>}
        <Button component={Link} to="/appointments" color="inherit">{t('navbar.appointments')}</Button>
        {role && <Button onClick={handleLogout} color="inherit">{t('navbar.logout')}</Button>}
        <Box sx={{ flex: 1 }} />
        <Notifications />
        <Select
          id="lang-select"
          value={lang}
          onChange={handleLangChange}
          sx={{ color: '#fff', borderColor: '#fff', minWidth: 100, mx: 2 }}
          inputProps={{ 'aria-label': t('navbar.language') }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="hi">हिन्दी</MenuItem>
        </Select>
        <Tooltip title={mode === 'dark' ? t('navbar.light_mode') : t('navbar.dark_mode')}>
          <Switch
            checked={mode === 'dark'}
            onChange={toggleColorMode}
            icon={<Brightness7Icon />}
            checkedIcon={<Brightness4Icon />}
            color="default"
            sx={{ ml: 1 }}
            inputProps={{ 'aria-label': mode === 'dark' ? t('navbar.light_mode') : t('navbar.dark_mode') }}
          />
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
