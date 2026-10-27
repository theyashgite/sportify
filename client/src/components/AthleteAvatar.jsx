import { useEffect, useState } from "react";

export default function AthleteAvatar({ name, photo, className }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo]);

  return <span className={className} role="img" aria-label={name}>
    <span>{name?.slice(0, 1).toUpperCase()}</span>
    {photo && !failed && <img src={photo} alt="" onError={() => setFailed(true)} />}
  </span>;
}
