import React, { useCallback, useEffect, useState } from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import axios from "axios";

const Notifications = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const token = sessionStorage.getItem("token");

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextNotifications = res.data.notifications || [];
      setNotifications(nextNotifications);
      setUnreadCount(nextNotifications.filter(n => !n.read).length);
      return nextNotifications;
    } catch {
      setError("Failed to fetch notifications");
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = async (hasUnread = unreadCount > 0) => {
    if (!token || !hasUnread) return;
    try {
      await axios.patch("/notifications/read-all", {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (readError) {
      console.error("Unable to mark notifications as read:", readError.message);
    }
  };

  const handleOpen = async (event) => {
    setAnchorEl(event.currentTarget);
    const nextNotifications = await fetchNotifications();
    await markAllAsRead(nextNotifications.some((notification) => !notification.read));
  };
  const markAsRead = async (notification) => {
    if (notification.read) return;
    try {
      await axios.patch(`/notifications/${notification._id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, read: true } : item));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (readError) {
      console.error("Unable to mark notification as read:", readError.message);
    }
  };

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);
  const id = open ? "notification-popover" : undefined;

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-describedby={id}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ minWidth: { xs: 280, sm: 360 }, maxWidth: 420 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Notifications</Typography>
            {unreadCount > 0 && <Typography variant="caption" color="primary">{unreadCount} unread</Typography>}
          </Stack>
          <Divider />
          <List sx={{ py: 0 }}>
          {loading ? (
            <ListItem><CircularProgress size={24} /></ListItem>
          ) : error ? (
            <ListItem><ListItemText primary={error} /></ListItem>
          ) : notifications.length === 0 ? (
            <ListItem><ListItemText primary="No notifications" /></ListItem>
          ) : (
            notifications.map((notif) => (
              <ListItem key={notif._id} button onClick={() => markAsRead(notif)} sx={{ bgcolor: notif.read ? "background.paper" : "action.hover", alignItems: "flex-start", cursor: notif.read ? "default" : "pointer" }}>
                <ListItemText primary={notif.message} secondary={new Date(notif.createdAt).toLocaleString()} />
              </ListItem>
            ))
          )}
          </List>
        </Box>
      </Popover>
    </>
  );
};

export default Notifications;
