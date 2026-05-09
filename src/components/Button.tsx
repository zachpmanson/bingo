import { Link, type LinkComponentProps } from '@tanstack/react-router'

export default function Button(
  params:
    | {
        children: React.ReactNode
        onClick: () => void
      }
    | (LinkComponentProps<'a'> & {
        onClick?: never
      }),
) {
  return params.onClick ? (
    <button
      onClick={params.onClick}
      className="border-2 rounded bg-primary hover:bg-primary-hover active:bg-primary-active w-fit py-1 px-2 border-solid border-black"
    >
      {params.children}
    </button>
  ) : (
    <Link
      {...params}
      className="border-2 rounded bg-blue-100 hover:bg-blue-200 active:bg-blue-300 w-fit py-1 px-2 border-solid border-black"
    />
  )
}
