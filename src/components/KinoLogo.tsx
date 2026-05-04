"use client";

/**
 * Authentic KinoPark logo — three trees + wordmark, lifted from
 * kinopark.am's `kp-logo-horizontal.svg`. Three discs (green / yellow /
 * orange) with little white trunks, set next to the "KINOPARK" wordmark
 * which sits between two horizontal rules.
 *
 * Use `height` to scale; aspect ratio is locked to 145:29.
 */
export function KinoLogo({
  height,
  /** When true, hides the wordmark and shows only the three-tree mark. */
  markOnly = false,
}: {
  /** Pixel height. Omit and the SVG will fill its container (height: 100%). */
  height?: number;
  markOnly?: boolean;
}) {
  // Omitting width/height lets the SVG scale to fill its container.
  const sizeProps =
    height !== undefined
      ? { height }
      : ({ style: { height: "100%", width: "auto" } } as const);

  if (markOnly) {
    return (
      <svg
        {...sizeProps}
        viewBox="0 0 43 29"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="KinoPark"
      >
        <circle cx="36.06" cy="19.05" r="5.95" fill="#E6652C" stroke="#FCFCFD" strokeWidth="0.6" />
        <circle cx="26.73" cy="16.60" r="8.40" fill="#FDB73A" stroke="#FCFCFD" strokeWidth="0.6" />
        <circle cx="12.61" cy="12.90" r="12.10" fill="#73A050" stroke="#FCFCFD" strokeWidth="0.6" />
        <path
          d="M12.61 17.91V28.02 M26.42 20.60V28.02 M36.16 23.87V28.02"
          stroke="#FCFCFD"
          strokeWidth="0.6"
        />
      </svg>
    );
  }

  return (
    <svg
      {...sizeProps}
      viewBox="0 0 145 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="KinoPark"
    >
      {/* Three trees */}
      <circle cx="36.06" cy="19.05" r="5.95" fill="#E6652C" stroke="#FCFCFD" strokeWidth="0.6" />
      <circle cx="26.73" cy="16.60" r="8.40" fill="#FDB73A" stroke="#FCFCFD" strokeWidth="0.6" />
      <circle cx="12.61" cy="12.90" r="12.10" fill="#73A050" stroke="#FCFCFD" strokeWidth="0.6" />
      <path
        d="M12.61 17.91V28.02 M26.42 20.60V28.02 M36.16 23.87V28.02"
        stroke="#FCFCFD"
        strokeWidth="0.6"
      />

      {/* Two horizontal rules above and below the wordmark */}
      <path d="M144.785 11.694H44.8008V12.4613H144.785V11.694Z" fill="#FCFCFD" />
      <path d="M144.785 27.7327H44.8008V28.5H144.785V27.7327Z" fill="#FCFCFD" />

      {/* "KINOPARK" wordmark — paths from the original SVG */}
      <path d="M46.6855 13.9291H47.6108V22.1064L55.5006 13.9291H56.7781L51.3482 19.4238L57.0028 26.3539H55.7881L50.678 20.0615L47.6108 23.1916V26.3539H46.6855V13.9291Z" fill="#FCFCFD" />
      <path d="M61.3472 13.9291H60.4199V26.3539H61.3472V13.9291Z" fill="#FCFCFD" />
      <path d="M66.0723 13.9291H66.9671L75.5271 24.7262V13.9291H76.3895V26.3539H75.7194L66.9671 15.3341V26.3539H66.0723V13.9291Z" fill="#FCFCFD" />
      <path d="M80.4785 20.1951V20.1628C80.4785 16.7777 82.9688 13.7428 86.7385 13.7428C90.4759 13.7428 92.9358 16.7129 92.9358 20.1V20.1628C92.9358 23.5499 90.4435 26.5523 86.7061 26.5523C82.9688 26.5523 80.4785 23.5762 80.4785 20.1951ZM92.0085 20.1951V20.1628C92.0085 17.0975 89.7815 14.5729 86.7061 14.5729C83.6308 14.5729 81.4422 17.0328 81.4422 20.1V20.1628C81.4422 23.23 83.6693 25.7223 86.7446 25.7223C89.82 25.7223 92.0085 23.2624 92.0085 20.1951Z" fill="#FCFCFD" />
      <path d="M96.5332 13.9756H101.036C103.751 13.9756 105.636 15.3928 105.636 17.7778V17.8102C105.636 20.428 103.409 21.7703 100.813 21.7703H97.4584V26.4025H96.5332V13.9756ZM100.846 20.9078C103.146 20.9078 104.711 19.6931 104.711 17.8709V17.8406C104.711 15.8585 103.208 14.8361 100.973 14.8361H97.4584V20.9098L100.846 20.9078Z" fill="#FCFCFD" />
      <path d="M111.354 13.8805H112.249L118.031 26.4025H117.001L115.436 22.9203H108.129L106.532 26.4025H105.574L111.354 13.8805ZM115.061 22.0902L111.802 14.9029L108.512 22.0902H115.061Z" fill="#FCFCFD" />
      <path d="M120.172 13.9756H125.379C126.912 13.9756 128.124 14.4555 128.859 15.1904C129.165 15.4968 129.407 15.8606 129.572 16.2608C129.737 16.6611 129.821 17.0899 129.819 17.5227V17.5632C129.819 19.6384 128.284 20.8208 126.175 21.1083L130.264 26.4106H129.114L125.152 21.2682H121.103V26.4106H120.176L120.172 13.9756ZM125.282 20.428C127.359 20.428 128.892 19.3752 128.892 17.5936V17.5632C128.892 15.901 127.582 14.8462 125.314 14.8462H121.099V20.4361L125.282 20.428Z" fill="#FCFCFD" />
      <path d="M132.5 13.9777H133.425V22.1226L141.315 13.9777H142.595L137.163 19.4704L142.817 26.4026H141.603L136.525 20.1102L133.425 23.2402V26.4026H132.5V13.9777Z" fill="#FCFCFD" />
    </svg>
  );
}
