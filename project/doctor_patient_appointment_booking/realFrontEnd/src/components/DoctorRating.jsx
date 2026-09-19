import React, { useEffect, useState } from "react";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import axios from "axios";

const DoctorRating = ({ doctorId }) => {
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchAvg = async () => {
      try {
        const res = await axios.get(`/reviews/average/${doctorId}`);
        setAvg(res.data.avgRating || 0);
        setCount(res.data.count || 0);
      } catch {
        setAvg(0);
        setCount(0);
      }
    };
    fetchAvg();
  }, [doctorId]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(avg) ? (
          <StarIcon key={i} style={{ color: "#FFD700" }} fontSize="small" />
        ) : (
          <StarBorderIcon key={i} style={{ color: "#FFD700" }} fontSize="small" />
        )
      )}
      <span style={{ fontSize: 13, color: "#555", marginLeft: 4 }}>
        {avg.toFixed(1)} ({count})
      </span>
    </div>
  );
};

export default DoctorRating;
