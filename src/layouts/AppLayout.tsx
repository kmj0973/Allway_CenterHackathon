import { Outlet, ScrollRestoration } from "react-router-dom";

function AppLayout() {
  return (
    <div className="min-h-dvh bg-gray-100">
      <div className="mx-auto min-h-dvh w-full max-w-app bg-white">
        <Outlet />
      </div>
      <ScrollRestoration />
    </div>
  );
}

export default AppLayout;
