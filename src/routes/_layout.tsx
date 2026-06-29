import { Link, Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout')({
  component: Layout,
});

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="flex justify-center p-4">
        <Link to="/" className="text-sm text-blue-400 underline">
          Home
        </Link>
      </footer>
    </div>
  );
}
