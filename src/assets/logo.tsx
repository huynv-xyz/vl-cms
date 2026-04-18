import { type SVGProps } from 'react'

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Vòng tròn bao quanh - Sát mép 2px để không bị mất nét */}
      <path
        d="M85 20C95 35 98 55 92 72C85 90 65 100 45 97C25 94 8 80 3 60C-2 40 5 18 25 7C40 -1 60 0 75 8"
        stroke="#14B8A6"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Lá chính (Teal) - Cực bự, chiếm trọn tâm diện tích */}
      <path
        d="M8 55C20 58 45 85 55 98C60 75 85 30 78 12C70 -5 45 10 35 20C20 35 10 50 8 55Z"
        fill="#14B8A6"
      />

      {/* Lá phụ (Lime) - Mập mạp và vươn cao */}
      <path
        d="M60 48C65 35 90 8 98 15C105 22 92 60 82 78C75 90 62 95 60 75C58 60 58 55 60 48Z"
        fill="#84CC16"
      />

      {/* Gân lá (tạo khối cho lá xanh) */}
      <path
        d="M75 45C78 40 85 32 85 32M72 55C75 50 82 42 82 42"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
    </svg>
  )
}