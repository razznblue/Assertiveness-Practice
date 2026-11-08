import type { ButtonProps } from '@/types'

const Button = (props: ButtonProps) => {
  const { text, link, backgroundColor, clickFunction, disableLink, cssOvveride, icon, disabled } =
    props

  const handleClick = async () => {
    if (disabled) return
    if (clickFunction) {
      await clickFunction()
    }

    if (!disableLink) {
      window.location.href = link
    }
  }

  return (
    <button
      className={
        cssOvveride
          ? cssOvveride
          : `${backgroundColor} text-center p-2 px-6 m-2 rounded-md min-w-40 cursor-pointer font-bold`
      }
      onClick={handleClick}
    >
      {icon && icon}
      <p>{text}</p>
    </button>
  )
}

export default Button
