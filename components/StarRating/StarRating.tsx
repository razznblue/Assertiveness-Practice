import { useState } from 'react'

interface StarRatingProps {
  onRatingChange: (rating: number) => void
  currentRating?: number
  size?: number
}

const StarRating = ({ onRatingChange, currentRating = 0, size = 40 }: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0)

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    const rating = starIndex + (isHalf ? 0.5 : 1)
    onRatingChange(rating)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    setHoverRating(starIndex + (isHalf ? 0.5 : 1))
  }

  const handleMouseLeave = () => {
    setHoverRating(0)
  }

  const displayRating = hoverRating || currentRating

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const isFilled = displayRating >= starIndex + 1
          const isHalf = displayRating === starIndex + 0.5

          return (
            <div
              key={starIndex}
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
              onMouseLeave={handleMouseLeave}
              className="relative cursor-pointer transition-transform hover:scale-110"
              style={{ width: size, height: size }}
            >
              {/* Background star (empty) */}
              <svg
                className="absolute inset-0 h-full w-full text-gray-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>

              {/* Filled star overlay */}
              {isFilled ? (
                <svg
                  className="absolute inset-0 h-full w-full text-[#4ec7b4]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ) : isHalf ? (
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <svg
                    className="h-full w-full text-[#4ec7b4]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Rating display text */}
      <div className="text-center">
        <div className="text-2xl font-bold text-[#4ec7b4]">
          {displayRating > 0 ? displayRating.toFixed(1) : 'Rate this session'}
        </div>
        <div className="text-sm text-slate-400">
          {displayRating > 0 ? `${displayRating} out of 5` : 'Click or hover over stars to rate'}
        </div>
      </div>
    </div>
  )
}

export default StarRating
