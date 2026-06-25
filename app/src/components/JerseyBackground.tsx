export function JerseyBackground() {
  return (
    <div className="jersey-bg" aria-hidden="true">
      <svg
        className="jersey-bg-svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="jersey-base" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#001428" />
            <stop offset="35%" stopColor="#003060" />
            <stop offset="65%" stopColor="#0058A8" />
            <stop offset="100%" stopColor="#001830" />
          </linearGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#jersey-base)" />

        {/* Topographical contour bands — sharp stepped transitions */}
        <path
          d="M0,120 Q360,80 720,130 T1440,100 L1440,0 L0,0 Z"
          fill="#0A3D6E"
          opacity="0.55"
        />
        <path
          d="M0,220 Q400,170 800,240 T1440,200 L1440,0 L0,0 Z"
          fill="#0E4A82"
          opacity="0.4"
        />
        <path
          d="M0,340 Q300,290 600,350 Q900,410 1200,330 T1440,380 L1440,0 L0,0 Z"
          fill="#1260A0"
          opacity="0.35"
        />
        <path
          d="M0,480 Q500,420 900,490 T1440,450 L1440,0 L0,0 Z"
          fill="#1A78C0"
          opacity="0.25"
        />
        <path
          d="M0,600 Q350,540 700,610 T1440,570 L1440,0 L0,0 Z"
          fill="#2088D4"
          opacity="0.18"
        />

        {/* Jagged contour lines */}
        <g fill="none" stroke="#D4A843" strokeOpacity="0.14" strokeWidth="1.25">
          <path d="M0,180 L120,175 L240,185 L360,170 L480,182 L600,168 L720,180 L840,172 L960,184 L1080,170 L1200,178 L1320,174 L1440,180" />
          <path d="M0,300 L100,295 L200,308 L320,292 L440,305 L560,290 L680,302 L800,288 L920,300 L1040,294 L1160,306 L1280,290 L1440,298" />
          <path d="M0,420 L140,412 L280,428 L420,415 L560,430 L700,418 L840,432 L980,420 L1120,434 L1260,418 L1440,425" />
          <path d="M0,540 L110,532 L220,548 L330,535 L440,550 L550,538 L660,552 L770,540 L880,554 L990,542 L1100,556 L1210,544 L1440,548" />
          <path d="M0,660 L130,652 L260,668 L390,655 L520,670 L650,658 L780,672 L910,660 L1040,674 L1170,662 L1300,676 L1440,668" />
        </g>

        {/* Subtle gold piping accents */}
        <line
          x1="0"
          y1="0"
          x2="1440"
          y2="0"
          stroke="#D4A843"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
      </svg>
      <div className="jersey-bg-overlay" />
    </div>
  );
}
