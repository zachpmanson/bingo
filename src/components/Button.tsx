import { Link, type LinkComponentProps } from '@tanstack/react-router';

type Params = { className?: string } & (
  | {
      children: React.ReactNode;
      onClick: () => void;
      disabled?: boolean;
    }
  | (LinkComponentProps<'a'> & {
      onClick?: never;
    })
);

export default function Button(params: Params) {
  return params.onClick ? (
    <button
      onClick={params.onClick}
      disabled={params.disabled}
      className={`text-center border-2 rounded bg-primary hover:bg-primary-hover active:bg-primary-active w-fit py-1 px-2 border-solid border-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary ${params.className ?? ''}`}
    >
      {params.children}
    </button>
  ) : (
    <Link
      {...params}
      className={`text-center border-2 rounded bg-blue-100 hover:bg-blue-200 active:bg-blue-300 w-fit py-1 px-2 border-solid border-black ${params.className}`}
    />
  );
}
