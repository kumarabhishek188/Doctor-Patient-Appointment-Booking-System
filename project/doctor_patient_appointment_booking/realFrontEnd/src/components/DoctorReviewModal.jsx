import React, { useState, useEffect } from "react";
import { Button, Modal, Box, Typography, Rating, TextField, Alert } from "@mui/material";
import axios from "axios";

const DoctorReviewModal = ({ doctorId, doctorName }) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const token = sessionStorage.getItem("token");
  const userRole = sessionStorage.getItem("role");

  useEffect(() => {
    if (!open) return;
    // Check if already reviewed
    const fetchReview = async () => {
      try {
        const res = await axios.get(`/reviews/${doctorId}`);
        const userId = sessionStorage.getItem("userId");
        const found = (res.data.reviews || []).find(r => r.patientId === userId);
        if (found) {
          setAlreadyReviewed(true);
          setRating(found.rating);
          setReview(found.review || "");
          setUserReview(found);
        } else {
          setAlreadyReviewed(false);
          setRating(0);
          setReview("");
          setUserReview(null);
        }
      } catch {
        setAlreadyReviewed(false);
      }
    };
    fetchReview();
  }, [open, doctorId]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    try {
      await axios.post(
        "/reviews",
        { doctorId, rating, review, bookingId: "general" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Review submitted!");
      setAlreadyReviewed(true);
      setUserReview({ rating, review });
    } catch (err) {
      setError(
        err.response?.data?.msg || "Error submitting review. You may have already reviewed this doctor."
      );
    }
  };

  if (userRole !== "patient") return null;

  return (
    <>
      <Button variant="outlined" size="small" onClick={handleOpen} sx={{ mt: 1 }}>
        Rate & Review
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: 24, maxWidth: 400, mx: "auto", mt: 10 }}>
          <Typography variant="h6" gutterBottom>
            Rate & Review {doctorName}
          </Typography>
          {alreadyReviewed ? (
            <Box>
              <Alert severity="info">You have already reviewed this doctor.</Alert>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your Rating: {userReview?.rating} star{userReview?.rating > 1 ? "s" : ""}
              </Typography>
              {userReview?.review && (
                <Typography variant="body2" color="text.secondary">
                  "{userReview.review}"
                </Typography>
              )}
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Rating
                name="doctor-rating"
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
              />
              <TextField
                label="Write a review (optional)"
                multiline
                minRows={2}
                fullWidth
                value={review}
                onChange={(e) => setReview(e.target.value)}
                sx={{ my: 1 }}
              />
              <Button type="submit" variant="contained" color="primary">
                Submit Review
              </Button>
            </form>
          )}
          {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </Box>
      </Modal>
    </>
  );
};

export default DoctorReviewModal;
