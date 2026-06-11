import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { FaMapMarkerAlt, FaGlobe } from "react-icons/fa";
import { ApiV2 } from "../api/apiLink";
import styles from "./SiteSelector.module.scss";

export default function SiteSelector({ value, onChange, allSitesLabel = "All Sites", className = "" }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeSite = useSelector((store) => store.activeSite);

  useEffect(() => {
    let cancelled = false;
    const fetchSites = async () => {
      try {
        const res = await ApiV2.get("/v2/all-site");
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setSites(data);
      } catch {
        if (!cancelled) setSites([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSites();
    return () => { cancelled = true; };
  }, []);

  const isDisabled = !!activeSite && !!activeSite.id;

  const displayValue = isDisabled ? activeSite.id : (value || "");

  const handleChange = (e) => {
    const id = e.target.value || null;
    const site = sites.find((s) => s.id === id);
    if (onChange) onChange(id, site?.name || null);
  };

  useEffect(() => {
    if (isDisabled && onChange && activeSite) {
      onChange(activeSite.id, activeSite.name);
    }
  }, [isDisabled, activeSite, onChange]);

  if (loading) {
    return (
      <div className={`${styles.wrapper} ${className}`}>
        <div className={styles.loading}>Loading sites...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.selectWrapper}>
        <span className={styles.icon}>
          {isDisabled ? <FaMapMarkerAlt /> : <FaGlobe />}
        </span>
        <Form.Select
          value={displayValue}
          onChange={handleChange}
          disabled={isDisabled}
          className={`${styles.select} ${isDisabled ? styles.disabled : ""}`}
        >
          <option value="">{allSitesLabel}</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </Form.Select>
        {isDisabled && (
          <span className={styles.lockHint}>Header site active</span>
        )}
      </div>
    </div>
  );
}
