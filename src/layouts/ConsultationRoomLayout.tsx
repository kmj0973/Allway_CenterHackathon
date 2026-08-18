import { Outlet } from "react-router-dom";

function ConsultationRoomLayout() {
  return (
    <div className="h-dvh w-screen overflow-hidden bg-[#1A1A1A]">
      <Outlet />
    </div>
  );
}

export default ConsultationRoomLayout;
