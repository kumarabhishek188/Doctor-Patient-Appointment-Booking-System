import React, { useEffect, useState } from "react";
import { Box, Typography, Rating, TextField, Button, Alert } from "@mui/material";
import axios from "axios";

const SimpleReviewBox = ({ doctorId }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = sessionStorage.getItem("token");
  const userRole = sessionStorage.getItem("role");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    // Fetch user's review for this doctor
    const fetchReview = async () => {
      try {
        const res = await axios.get(`/reviews/${doctorId}`);
        const found = (res.data.reviews || []).find(r => r.patientId === userId && r.bookingId === "general");
        if (found) {
          setSubmitted(true);
          setUserReview(found);
        }
      } catch {
        setSubmitted(false);
      }
    };
    fetchReview();
  }, [doctorId, userId]);

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
    <Box sx={{ mt: 1, mb: 1, p: 1, border: "1px solid #eee", borderRadius: 2 }}>
      <Typography variant="subtitle2">Your Review</Typography>
      {submitted && userReview ? (
        <>
          <Rating value={userReview.rating} readOnly size="small" />
          {userReview.review && (
            <Typography variant="body2" color="text.secondary">
              "{userReview.review}"
            </Typography>
          )}
          <Alert severity="info" sx={{ mt: 1 }}>You have already reviewed this doctor.</Alert>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <Rating
            name="doctor-rating"
            value={rating}
            onChange={(_, newValue) => setRating(newValue)}
            size="small"
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
          <Button type="submit" variant="contained" color="primary" size="small">
            Submit Review
          </Button>
          {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </form>
      )}
    </Box>
  );
};

export default SimpleReviewBox;
