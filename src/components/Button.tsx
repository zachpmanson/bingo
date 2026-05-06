export default function Button({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="border-2 rounded bg-blue-100 hover:bg-blue-200 active:bg-blue-300 w-fit py-1 px-2 border-solid border-black"
    >
      {children}
    </button>
  )
}
