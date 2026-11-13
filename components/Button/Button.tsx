import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: ReactNode
  link?: string
  backgroundColor?: string
  clickFunction?: (() => void | Promise<void>) | null
  disableLink?: boolean
  cssOvveride?: string
  icon?: ReactNode
  children?: ReactNode
}

const Button = (props: ButtonProps) => {
  const {
    text,
    link,
    backgroundColor,
    clickFunction,
    disableLink = false,
    cssOvveride,
    icon,
    disabled,
    children,
    className,
    onClick,
    ...rest
  } = props

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    }

    if (disabled) return
    if (clickFunction) {
      await clickFunction()
    }

    if (!disableLink && link) {
      window.location.href = link
    }
  }

  const finalClassName =
    cssOvveride ||
    className ||
    `${backgroundColor || 'bg-blue-500'} text-center p-2 px-6 m-2 rounded-md min-w-40 cursor-pointer font-bold`

  return (
    <button className={finalClassName} onClick={handleClick} disabled={disabled} {...rest}>
      {icon && icon}
      {children || (text && <p>{text}</p>)}
    </button>
  )
}

export default Button
