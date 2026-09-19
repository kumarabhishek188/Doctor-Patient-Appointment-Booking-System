import React, { useEffect, useState } from "react";
import { Typography, Box } from "@mui/material";
import axios from "axios";

const ReviewStatus = ({ doctorId, bookingId }) => {
  const [reviewed, setReviewed] = useState(false);
  const [review, setReview] = useState(null);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchReview = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`/reviews/${doctorId}`);
        const found = (res.data.reviews || []).find(r => r.bookingId === bookingId);
        if (found) {
          setReviewed(true);
          setReview(found);
        }
      } catch {
        setReviewed(false);
      }
    };
    fetchReview();
  }, [doctorId, bookingId, token]);

  if (!reviewed) return null;
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="body2" color="success.main">
        You rated: {review.rating} star{review.rating > 1 ? "s" : ""}
      </Typography>
      {review.review && (
        <Typography variant="body2" color="text.secondary">
          "{review.review}"
        </Typography>
      )}
    </Box>
  );
};

export default ReviewStatus;
