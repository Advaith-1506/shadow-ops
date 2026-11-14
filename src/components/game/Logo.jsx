import React from "react";
import logo from "../../assets/shadow-ops-logo.png";
export default function Logo({ hero = false }) {
  return (
    <img
      className={`command-logo ${hero ? "command-logo-hero" : ""}`}
      src={logo}
      alt="Shadow Ops"
      width="1280"
      height="1280"
      decoding="async"
      loading={hero ? "eager" : "lazy"}
    />
  );
}
