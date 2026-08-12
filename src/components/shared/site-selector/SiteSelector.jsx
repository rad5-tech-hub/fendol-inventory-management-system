import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { FaMapMarkerAlt, FaGlobe } from "react-icons/fa";
import CustomDropdown from "../custom-dropdown/CustomDropdown";
import { ApiV2 } from "../api/apiLink";
import styles from "./SiteSelector.module.scss";

export default function SiteSelector({ value, onChange, allSitesLabel = "All Sites", className = "" }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeSite = useSelector((store) => store.activeSite);
  const emittedSiteIdRef = useRef(null);

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

  const siteOptions = sites.map((s) => ({ value: s.id, label: s.name }));

  const handleChange = (val) => {
    const id = val || null;
    const site = sites.find((s) => s.id === id);
    if (onChange) onChange(id, site?.name || null);
  };

  useEffect(() => {
    if (!isDisabled || !onChange || !activeSite) return;
    const siteId = activeSite.id;
    if (emittedSiteIdRef.current === siteId) return;
    emittedSiteIdRef.current = siteId;
    onChange(siteId, activeSite.name);
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
        <CustomDropdown
          options={siteOptions}
          value={displayValue}
          onChange={handleChange}
          disabled={isDisabled}
          placeholder={isDisabled ? (activeSite?.name || allSitesLabel) : allSitesLabel}
          triggerClassName={styles.selectTrigger}
          className={styles.select}
        />
        {isDisabled && (
          <span className={styles.lockHint}>Header site active</span>
        )}
      </div>
    </div>
  );
}
