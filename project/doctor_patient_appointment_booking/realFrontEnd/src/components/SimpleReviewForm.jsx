import React, { useEffect, useState } from "react";
import { Box, Typography, Rating, TextField, Button, Alert } from "@mui/material";
import axios from "axios";

const SimpleReviewForm = ({ doctorId }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userReview, setUserReview] = useState(null);
  const token = sessionStorage.getItem("token");
  const userRole = sessionStorage.getItem("role");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    // Fetch if user already reviewed
    const fetchReview = async () => {
      try {
        const res = await axios.get(`/reviews/${doctorId}`);
        const found = (res.data.reviews || []).find(r => r.patientId === userId && r.bookingId === "general");
        if (found) {
          setUserReview(found);
          setSubmitted(true);
        }
      } catch {
        setUserReview(null);
        setSubmitted(false);
      }
    };
    if (userRole === "patient") fetchReview();
  }, [doctorId, userId, userRole]);

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
      setSubmitted(true);
      setUserReview({ rating, review });
    } catch (err) {
      setError(
        err.response?.data?.msg || "Error submitting review. You may have already reviewed this doctor."
      );
    }
  };

  if (userRole !== "patient") return null;

  return (
    <Box sx={{ mt: 1 }}>
      {submitted && userReview ? (
        <Box>
          <Alert severity="info">You have already reviewed this doctor.</Alert>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Your Rating: {userReview.rating} star{userReview.rating > 1 ? "s" : ""}
          </Typography>
          {userReview.review && (
            <Typography variant="body2" color="text.secondary">
              "{userReview.review}"
            </Typography>
          )}
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Typography variant="subtitle2">Rate & Review</Typography>
          {success && <Alert severity="success">{success}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
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
    </Box>
  );
};

export default SimpleReviewForm;
