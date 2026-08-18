import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ConsultationRoomLayout from "@/layouts/ConsultationRoomLayout";
import AftercarePage from "@/pages/aftercare";
import EmergencyReportPage from "@/pages/aftercare/emergency-report";
import HomePage from "@/pages/home";
import ConsultationWaitingPage from "@/pages/consultation-waiting";
import ConsultationRoomPage from "@/pages/consultation-room";
import ConsultationHubPage from "@/pages/consultation-hub";
import OnboardingPage from "@/pages/onboarding";
import LanguageSettingsPage from "@/pages/settings/language";
import ConsultationReservationLayout from "@/pages/consultation-reservation/layout";
import ConsultationSchedulePage from "@/pages/consultation-reservation/schedule";
import PreConsultationPage from "@/pages/consultation-reservation/pre-consultation";
import ConsultationConfirmedPage from "@/pages/consultation-confirmed";
import ConsultationCancelledPage from "@/pages/consultation-cancelled";
import ConsultationDetailPage from "@/pages/consultation-detail";
import ConsultationSummaryPage from "@/pages/consultation-summary";

const router = createBrowserRouter([
  {
    path: "/consultation/:appointmentId/room",
    element: <ConsultationRoomLayout />,
    children: [
      {
        index: true,
        element: <ConsultationRoomPage />,
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/home",
        element: <HomePage />,
      },
      {
        path: "/consultation",
        children: [
          {
            index: true,
            element: <ConsultationHubPage />,
          },

          {
            path: "reservation",
            element: <ConsultationReservationLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="schedule" replace />,
              },
              {
                path: "schedule",
                element: <ConsultationSchedulePage />,
              },
              {
                path: "pre-consultation",
                element: <PreConsultationPage />,
              },
            ],
          },

          {
            path: ":appointmentId/confirmed",
            element: <ConsultationConfirmedPage />,
          },
          {
            path: ":appointmentId/cancelled",
            element: <ConsultationCancelledPage />,
          },
          {
            path: ":appointmentId/details",
            element: <ConsultationDetailPage />,
          },
          {
            path: ":appointmentId/waiting",
            element: <ConsultationWaitingPage />,
          },
          {
            path: "summary/:summaryId",
            element: <ConsultationSummaryPage />,
          },
        ],
      },
      {
        path: "/aftercare",
        element: <AftercarePage />,
      },
      {
        path: "/aftercare/emergency-report",
        element: <EmergencyReportPage />,
      },
      {
        path: "/",
        element: <OnboardingPage />,
      },
      {
        // 백엔드가 만드는 매직링크 경로. 온보딩에서 token 쿼리를 그대로 읽는다
        path: "/patient/access",
        element: <OnboardingPage />,
      },
      {
        path: "/settings/language",
        element: <LanguageSettingsPage />,
      },
    ],
  },
]);

export default router;
