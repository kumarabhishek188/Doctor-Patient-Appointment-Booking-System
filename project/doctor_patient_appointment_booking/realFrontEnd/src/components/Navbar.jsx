import React, { useEffect, useState, createContext, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import Notifications from "./Notifications";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CloseIcon from "@mui/icons-material/Close";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import { useTranslation } from "react-i18next";

// Theme context for dark mode
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

const Navbar = () => {
  const { mode, toggleColorMode } = useColorMode();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem('language') || i18n.language || 'en');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [authVersion, setAuthVersion] = useState(0);
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const name = sessionStorage.getItem("name") || (role === "doctor" ? t("navbar.doctor_account", "Doctor account") : t("navbar.patient_account", "Patient account"));
  const isAuthenticated = Boolean(token && role);
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    setMobileOpen(false);
    setAccountAnchor(null);
  }, [location.pathname]);

  useEffect(() => {
    const portalTitle = role === "doctor" ? "Doctor Portal" : role === "patient" ? "Patient Portal" : "MediConnect";
    document.title = `${portalTitle} | MediConnect`;
  }, [authVersion, role]);

  useEffect(() => {
    const refreshAuth = () => setAuthVersion((value) => value + 1);
    window.addEventListener("auth-change", refreshAuth);
    return () => window.removeEventListener("auth-change", refreshAuth);
  }, []);

  void authVersion;

  const links = [
    { label: t("navbar.doctors"), path: "/doctors", icon: <LocalHospitalOutlinedIcon />, visible: role === "patient" },
    { label: t("navbar.appointments"), path: "/appointments", icon: <CalendarMonthOutlinedIcon />, visible: isAuthenticated },
  ].filter((link) => link.visible);

  const isActive = (path) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleLogout = () => {
    sessionStorage.clear();
    setAccountAnchor(null);
    setMobileOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login", { replace: true });
  };

  const handleLangChange = (event) => {
    const newLang = event.target.value;
    setLang(newLang);
    localStorage.setItem('language', newLang);
    i18n.changeLanguage(newLang);
  };

  const goTo = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const renderLink = (link, mobile = false) => mobile ? (
    <ListItemButton key={link.path} selected={isActive(link.path)} onClick={() => goTo(link.path)} sx={{ borderRadius: 2, mb: .5 }}>
      <ListItemIcon sx={{ minWidth: 40, color: isActive(link.path) ? "primary.main" : "inherit" }}>{link.icon}</ListItemIcon>
      <ListItemText primary={link.label} />
    </ListItemButton>
  ) : (
    <Button key={link.path} onClick={() => goTo(link.path)} startIcon={link.icon} aria-current={isActive(link.path) ? "page" : undefined} sx={{ color: "inherit", px: 1.5, py: 1, borderRadius: 1.5, fontWeight: isActive(link.path) ? 800 : 600, bgcolor: isActive(link.path) ? "rgba(255,255,255,.14)" : "transparent", "&:hover": { bgcolor: "rgba(255,255,255,.12)" } }}>
      {link.label}
    </Button>
  );

  return (
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "primary.main" }}>
      <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, gap: { xs: 1, md: 2 }, px: { xs: 2, md: 4 } }}>
        <Button onClick={() => goTo("/")} startIcon={<LocalHospitalOutlinedIcon />} aria-label="MediConnect home" sx={{ color: "inherit", fontWeight: 900, fontSize: { xs: "1rem", md: "1.15rem" }, letterSpacing: 0, px: 0, minWidth: "auto", "&:hover": { bgcolor: "transparent" } }}>
          Medi<span style={{ opacity: .72 }}>Connect</span>
        </Button>
        <Stack direction="row" spacing={.5} sx={{ display: { xs: "none", md: "flex" }, ml: 2 }}>{links.map((link) => renderLink(link))}</Stack>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" alignItems="center" spacing={{ xs: .25, md: 1 }}>
          {isAuthenticated && <Notifications />}
          <Tooltip title={mode === "dark" ? t("navbar.light_mode") : t("navbar.dark_mode")}>
            <IconButton onClick={toggleColorMode} color="inherit" aria-label={mode === "dark" ? t("navbar.light_mode") : t("navbar.dark_mode")}>{mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}</IconButton>
          </Tooltip>
          <Select value={lang} onChange={handleLangChange} variant="standard" disableUnderline sx={{ display: { xs: "none", md: "block" }, color: "inherit", width: 54, minWidth: 54, "& .MuiSelect-select": { py: .5, pr: 2.5, pl: .25 }, "& .MuiSvgIcon-root": { color: "inherit", right: 0 } }} inputProps={{ "aria-label": t("navbar.language") }}>
            <MenuItem value="en">EN</MenuItem><MenuItem value="hi">हिन्दी</MenuItem>
          </Select>
          {isAuthenticated ? <>
            <Button onClick={(event) => setAccountAnchor(event.currentTarget)} startIcon={<Avatar sx={{ width: 30, height: 30, bgcolor: "secondary.main", color: "secondary.contrastText", fontSize: ".8rem" }}>{initials}</Avatar>} sx={{ display: { xs: "none", md: "flex" }, color: "inherit", textTransform: "none", textAlign: "left", px: 1, fontWeight: 700 }}>
              <Box><Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{name}</Typography><Typography variant="caption" sx={{ opacity: .72, textTransform: "capitalize" }}>{role}</Typography></Box>
            </Button>
            <Menu anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={() => setAccountAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
              <MenuItem disabled>{t("navbar.signed_in_as", "Signed in as")} {name}</MenuItem><Divider />
              <MenuItem onClick={handleLogout}><ListItemIcon><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>{t("navbar.logout")}</MenuItem>
            </Menu>
          </> : <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
            <Button onClick={() => goTo("/login")} startIcon={<LoginOutlinedIcon />} sx={{ color: "inherit", fontWeight: 700 }}>{t("navbar.login")}</Button>
            <Button onClick={() => goTo("/register")} variant="contained" color="secondary" startIcon={<PersonAddAltOutlinedIcon />} sx={{ fontWeight: 800 }}>{t("navbar.register")}</Button>
          </Stack>}
          <IconButton onClick={() => setMobileOpen(true)} color="inherit" sx={{ display: { xs: "inline-flex", md: "none" } }} aria-label={t("navbar.open_menu", "Open navigation menu")}><MenuIcon /></IconButton>
        </Stack>
      </Toolbar>
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: "min(86vw, 340px)", p: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1, pb: 2 }}><Typography variant="h6" sx={{ fontWeight: 900 }}>Medi<span style={{ color: "#009688" }}>Connect</span></Typography><IconButton onClick={() => setMobileOpen(false)} aria-label={t("navbar.close_menu", "Close navigation menu")}><CloseIcon /></IconButton></Stack>
        <Divider /><List sx={{ py: 2 }}>{links.map((link) => renderLink(link, true))}</List><Divider />
        <Stack spacing={1.5} sx={{ p: 1, pt: 2 }}>
          <Select fullWidth size="small" value={lang} onChange={handleLangChange} aria-label={t("navbar.language")}><MenuItem value="en">English</MenuItem><MenuItem value="hi">हिन्दी</MenuItem></Select>
          {isAuthenticated ? <Button fullWidth variant="outlined" color="error" startIcon={<LogoutOutlinedIcon />} onClick={handleLogout}>{t("navbar.logout")}</Button> : <><Button fullWidth variant="outlined" startIcon={<LoginOutlinedIcon />} onClick={() => goTo("/login")}>{t("navbar.login")}</Button><Button fullWidth variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => goTo("/register")}>{t("navbar.register")}</Button></>}
        </Stack>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
