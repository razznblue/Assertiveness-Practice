import { ReactNode } from 'react'

/* eslint-disable no-param-reassign */
interface ButtonProps {
  text: string
  link: string
  backgroundColor?: string
  clickFunction: () => {}
  disableLink: boolean
  cssOvveride?: string
  icon?: ReactNode
  disabled?: boolean
}

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
    <div
      className={
        cssOvveride
          ? cssOvveride
          : `${backgroundColor} text-center p-2 px-4 m-2 rounded-md min-w-32 cursor-pointer font-bold`
      }
      onClick={handleClick}
    >
      {icon && icon}
      <p>{text}</p>
    </div>
  )
}

export default Button
