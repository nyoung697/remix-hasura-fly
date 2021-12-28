import { Outlet } from "remix";

export default function ProfileRoute() {
  return (
    <div className="mt-20">
      <main className="max-w-4xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
