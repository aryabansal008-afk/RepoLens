import { useEffect, useRef, useState } from 'react';
import { getRateLimit, subscribeRateLimit } from '../services/githubApi';

export default function RateLimitBanner() {
  const [info, setInfo] = useState(getRateLimit);
  const bannerRef = useRef(null);

  useEffect(() => subscribeRateLimit(setInfo), []);

  const visible = info.remaining != null && (info.remaining <= 8 || info.limited);

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) {
      document.documentElement.style.removeProperty('--rate-banner-space');
      return undefined;
    }
    const apply = () => {
      const bottom = banner.getBoundingClientRect().bottom;
      document.documentElement.style.setProperty('--rate-banner-space', `${Math.ceil(bottom + 16)}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(banner);
    window.addEventListener('resize', apply);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', apply);
      document.documentElement.style.removeProperty('--rate-banner-space');
    };
  }, [visible, info.remaining, info.limit]);

  if (!visible) return null;
  const reset = info.reset ? new Date(info.reset * 1000).toLocaleTimeString() : 'later';

  return (
    <div className="rate-banner" role="status" ref={bannerRef}>
      GitHub rate limit: {info.remaining} of {info.limit || '—'} requests left. Resets around {reset}.
    </div>
  );
}
