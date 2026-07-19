import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from "react-native-svg";

export type IconName =
  | "dashboard"
  | "calendar"
  | "books"
  | "map"
  | "chart"
  | "star"
  | "clipboard"
  | "building"
  | "tasks"
  | "bell"
  | "check"
  | "lock"
  | "unlock"
  | "sync"
  | "close"
  | "logout"
  | "priority-high"
  | "priority-medium-high"
  | "priority-neutral"
  | "priority-medium-low"
  | "priority-low"
  | "arrow-right"
  | "menu"
  | "filter"
  | "chevron-left"
  | "chevron-right"
  | "search"
  | "edit"
  | "users"
  | "plus"
  | "help-circle"
  | "download"
  | "expand"
  | "compress";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

/** Ícones SVG — mesmos paths de `app/src/components/ui/Icon.tsx`. */
export function Icon({ name, size = 18, color = "#E8C66A" }: Props) {
  const stroke = color;
  const common = {
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "dashboard" ? (
        <>
          <Rect x="3" y="3" width="7" height="7" rx="1" {...common} />
          <Rect x="14" y="3" width="7" height="7" rx="1" {...common} />
          <Rect x="3" y="14" width="7" height="7" rx="1" {...common} />
          <Rect x="14" y="14" width="7" height="7" rx="1" {...common} />
        </>
      ) : null}
      {name === "calendar" ? (
        <>
          <Rect x="3" y="4" width="18" height="18" rx="2" {...common} />
          <Line x1="3" y1="10" x2="21" y2="10" {...common} />
          <Line x1="8" y1="2" x2="8" y2="6" {...common} />
          <Line x1="16" y1="2" x2="16" y2="6" {...common} />
        </>
      ) : null}
      {name === "books" ? (
        <>
          <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" {...common} />
          <Path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            {...common}
          />
        </>
      ) : null}
      {name === "menu" ? (
        <>
          <Line x1="3" y1="6" x2="21" y2="6" {...common} />
          <Line x1="3" y1="12" x2="21" y2="12" {...common} />
          <Line x1="3" y1="18" x2="21" y2="18" {...common} />
        </>
      ) : null}
      {name === "close" ? (
        <>
          <Line x1="18" y1="6" x2="6" y2="18" {...common} />
          <Line x1="6" y1="6" x2="18" y2="18" {...common} />
        </>
      ) : null}
      {name === "map" ? (
        <>
          <Polygon
            points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6"
            {...common}
          />
          <Line x1="8" y1="3" x2="8" y2="18" {...common} />
          <Line x1="16" y1="6" x2="16" y2="21" {...common} />
        </>
      ) : null}
      {name === "chart" ? (
        <>
          <Line x1="18" y1="20" x2="18" y2="10" {...common} />
          <Line x1="12" y1="20" x2="12" y2="4" {...common} />
          <Line x1="6" y1="20" x2="6" y2="14" {...common} />
        </>
      ) : null}
      {name === "star" ? (
        <Polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          {...common}
        />
      ) : null}
      {name === "clipboard" || name === "tasks" ? (
        <>
          <Path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            {...common}
          />
          <Rect x="8" y="2" width="8" height="4" rx="1" {...common} />
        </>
      ) : null}
      {name === "building" ? (
        <>
          <Rect x="4" y="2" width="16" height="20" rx="1" {...common} />
          <Line x1="9" y1="6" x2="9" y2="6.01" {...common} />
          <Line x1="15" y1="6" x2="15" y2="6.01" {...common} />
          <Line x1="9" y1="10" x2="9" y2="10.01" {...common} />
          <Line x1="15" y1="10" x2="15" y2="10.01" {...common} />
          <Line x1="9" y1="14" x2="9" y2="14.01" {...common} />
          <Line x1="15" y1="14" x2="15" y2="14.01" {...common} />
          <Path d="M9 22v-4h6v4" {...common} />
        </>
      ) : null}
      {name === "bell" ? (
        <>
          <Path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            {...common}
          />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" {...common} />
        </>
      ) : null}
      {name === "sync" ? (
        <>
          <Path
            d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
            {...common}
          />
          <Path d="M3 3v5h5" {...common} />
          <Path
            d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
            {...common}
          />
          <Path d="M16 16h5v5" {...common} />
        </>
      ) : null}
      {name === "logout" ? (
        <>
          <Path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
            {...common}
          />
          <Polyline points="16 17 21 12 16 7" {...common} />
          <Line x1="21" y1="12" x2="9" y2="12" {...common} />
        </>
      ) : null}
      {name === "check" ? (
        <Polyline points="20 6 9 17 4 12" {...common} />
      ) : null}
      {name === "lock" ? (
        <>
          <Rect x="3" y="11" width="18" height="11" rx="2" {...common} />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" {...common} />
        </>
      ) : null}
      {name === "unlock" ? (
        <>
          <Rect x="3" y="11" width="18" height="11" rx="2" {...common} />
          <Path d="M7 11V7a5 5 0 0 1 9.9-1" {...common} />
        </>
      ) : null}
      {name === "arrow-right" ? (
        <>
          <Line x1="5" y1="12" x2="19" y2="12" {...common} />
          <Polyline points="12 5 19 12 12 19" {...common} />
        </>
      ) : null}
      {name === "priority-high" ? (
        <>
          <Polyline points="7 14 12 9 17 14" {...common} />
          <Polyline points="7 19 12 14 17 19" {...common} />
        </>
      ) : null}
      {name === "priority-medium-high" ? (
        <Polyline points="7 15 12 9 17 15" {...common} />
      ) : null}
      {name === "priority-neutral" ? (
        <Line x1="5" y1="12" x2="19" y2="12" {...common} />
      ) : null}
      {name === "priority-medium-low" ? (
        <Polyline points="7 9 12 15 17 9" {...common} />
      ) : null}
      {name === "priority-low" ? (
        <>
          <Polyline points="7 10 12 15 17 10" {...common} />
          <Polyline points="7 5 12 10 17 5" {...common} />
        </>
      ) : null}
      {name === "filter" ? (
        <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" {...common} />
      ) : null}
      {name === "chevron-left" ? (
        <Polyline points="15 18 9 12 15 6" {...common} />
      ) : null}
      {name === "chevron-right" ? (
        <Polyline points="9 18 15 12 9 6" {...common} />
      ) : null}
      {name === "search" ? (
        <>
          <Circle cx="11" cy="11" r="8" {...common} />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" {...common} />
        </>
      ) : null}
      {name === "edit" ? (
        <>
          <Path d="M12 20h9" {...common} />
          <Path
            d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
            {...common}
          />
        </>
      ) : null}
      {name === "users" ? (
        <>
          <Path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            {...common}
          />
          <Circle cx="9" cy="7" r="4" {...common} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87" {...common} />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" {...common} />
        </>
      ) : null}
      {name === "plus" ? (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" {...common} />
          <Line x1="5" y1="12" x2="19" y2="12" {...common} />
        </>
      ) : null}
      {name === "help-circle" ? (
        <>
          <Circle cx="12" cy="12" r="10" {...common} />
          <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" {...common} />
          <Line x1="12" y1="17" x2="12.01" y2="17" {...common} />
        </>
      ) : null}
      {name === "download" ? (
        <>
          <Path d="M12 3v12" {...common} />
          <Path d="m7 10 5 5 5-5" {...common} />
          <Path d="M5 21h14" {...common} />
        </>
      ) : null}
      {name === "expand" ? (
        <>
          <Path d="M15 3h6v6" {...common} />
          <Path d="M9 21H3v-6" {...common} />
          <Path d="M21 3l-7 7" {...common} />
          <Path d="M3 21l7-7" {...common} />
        </>
      ) : null}
      {name === "compress" ? (
        <>
          <Path d="M4 14h6v6" {...common} />
          <Path d="M20 10h-6V4" {...common} />
          <Path d="M14 10l7-7" {...common} />
          <Path d="M3 21l7-7" {...common} />
        </>
      ) : null}
    </Svg>
  );
}
