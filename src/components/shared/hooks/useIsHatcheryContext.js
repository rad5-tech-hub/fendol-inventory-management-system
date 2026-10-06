import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ApiV2 } from '../api/apiLink';

let cachedSiteDetails = null;
let cachedSiteIdsKey = null;

const siteTypeName = (s) => s?.type?.name || s?.type || s?.description || s?.typeName || s?.name || '';
const isHatcheryType = (t) => String(t || '').toLowerCase().includes('hatch');

export default function useIsHatcheryContext() {
  const activeSite = useSelector((store) => store.activeSite);
  const user = useSelector((store) => store.user);
  const isSuperAdmin = useSelector((store) => (store.user?.userTypes || []).includes('super_admin'));

  const [userSiteDetails, setUserSiteDetails] = useState(() => {
    const idsKey = JSON.stringify((user?.userSites || []).filter(s => typeof s === 'string').sort());
    if (cachedSiteDetails && cachedSiteIdsKey === idsKey) return cachedSiteDetails;
    return (user?.userSites || []).filter(s => typeof s === 'object');
  });

  useEffect(() => {
    if (isSuperAdmin) return;
    const sites = user?.userSites || [];
    const siteIds = sites.filter(s => typeof s === 'string');
    const objectSites = sites.filter(s => typeof s === 'object');

    if (siteIds.length === 0) {
      cachedSiteDetails = objectSites;
      cachedSiteIdsKey = JSON.stringify([]);
      setUserSiteDetails(objectSites);
      return;
    }

    const idsKey = JSON.stringify(siteIds.sort());
    if (cachedSiteDetails && cachedSiteIdsKey === idsKey) {
      setUserSiteDetails(cachedSiteDetails);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await ApiV2.get('/v2/all-site');
        const allSites = Array.isArray(res.data?.data) ? res.data.data : [];
        const resolved = siteIds
          .map(id => allSites.find(s => s.id === id))
          .filter(Boolean);
        const details = [...objectSites, ...resolved];
        if (!cancelled) {
          cachedSiteDetails = details;
          cachedSiteIdsKey = idsKey;
          setUserSiteDetails(details);
        }
      } catch {
        if (!cancelled) {
          cachedSiteDetails = objectSites;
          cachedSiteIdsKey = idsKey;
          setUserSiteDetails(objectSites);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [isSuperAdmin, user?.userSites]);

  return useMemo(() => {
    if (isSuperAdmin) {
      return !!activeSite && isHatcheryType(siteTypeName(activeSite));
    }
    return userSiteDetails.some(s => isHatcheryType(siteTypeName(s)))
      || (!!activeSite && isHatcheryType(siteTypeName(activeSite)));
  }, [isSuperAdmin, activeSite, userSiteDetails]);
}
