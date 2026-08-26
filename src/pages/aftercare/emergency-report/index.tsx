import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getEmergencyMedicalReport } from "@/apis/aftercare.api";
import xIcon from "@/assets/aftercare/x.svg";
import gradientTop from "@/assets/shared/home-gradient-top.png";

// 서버가 여러 항목을 줄바꿈 하나로 이어 붙여 내려준다
function splitLines(value: string | undefined): string[] {
  if (!value) return [];

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

interface SectionProps {
  title: string;
  titleEn: string;
  children: ReactNode;
}

function Section({ title, titleEn, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3.5 pt-9">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[18px] leading-normal font-semibold tracking-[-0.45px] text-[#32303a]">
          {title}
        </h2>
        <p className="text-xs leading-[1.4] text-[#7b7a80] uppercase">
          {titleEn}
        </p>
        <div className="mt-1.5 h-px w-full bg-[#e0e0e0]" />
      </div>

      <dl className="flex flex-col">{children}</dl>
    </section>
  );
}

interface RowProps {
  label: string;
  labelEn: string;
  children: ReactNode;
}

function Row({ label, labelEn, children }: RowProps) {
  return (
    <div className="flex items-start">
      <dt className="w-29.25 shrink-0 py-2 text-[15px] leading-[1.4] font-medium tracking-[-0.375px] text-[#302f31]">
        {label} <span className="whitespace-nowrap">({labelEn})</span>
      </dt>
      <dd className="flex-1 py-2 text-[15px] leading-[1.4] tracking-[-0.375px] text-[#4b4b4e]">
        {children}
      </dd>
    </div>
  );
}

function EmergencyReportPage() {
  const { t } = useTranslation("report");
  const navigate = useNavigate();

  const { data: report } = useQuery({
    queryKey: ["aftercare", "emergencyReport"],
    queryFn: getEmergencyMedicalReport,
  });

  const materials = splitLines(report?.procedure.materials);
  const medications = splitLines(report?.medicationAndAllergies.medications);
  const allergies = report?.medicationAndAllergies.allergies ?? [];

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#fcfcfc] pb-12">
      {/* 헤더와 제목 뒤에 흐리게 번지는 장식. 사후관리 화면과 같은 그라데이션을 재사용한다 */}
      <img
        aria-hidden
        src={gradientTop}
        alt=""
        className="pointer-events-none absolute left-1/2 max-w-none -translate-x-1/2"
        style={{ top: -202, width: 650, height: 650 }}
      />

      <div className="relative flex justify-end px-5 pt-4.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t("close")}
          className="flex size-14 items-center justify-center"
        >
          <img aria-hidden src={xIcon} alt="" className="size-6" />
        </button>
      </div>

      <div className="relative px-5">
        <div className="mt-1.5 flex flex-col gap-2.5">
          <h1 className="text-[32px] leading-normal font-semibold tracking-[-0.8px] whitespace-pre-line text-[#32303a]">
            {t("title", { name: report?.patient.name ?? "" })}
          </h1>
          <p className="text-xl leading-[1.4] text-[#7b7a80]">
            Global Medical Summary
          </p>
        </div>

        <div className="mt-9 flex flex-col gap-4">
          <p className="text-sm leading-[1.4] text-[#9795a0]">
            본 문서는 환자의 응급 상황 발생 시 현지 의료진의 판단을 돕기 위한
            참고 자료입니다. 정식 의료 진단을 대체하지 않습니다.
          </p>
          <p className="text-sm leading-[1.4] text-[#9795a0]">
            NOTICE: This document is provided solely as a reference to assist
            local medical professionals in emergencies. It does not replace a
            formal medical diagnosis.
          </p>
          <div className="h-px w-full bg-[#e0e0e0]" />
        </div>

        <Section title="환자 기본 정보" titleEn="Patient Information">
          <Row label="성명" labelEn="Name">
            {report?.patient.displayName}
          </Row>
          <Row label="생년월일" labelEn="DOB">
            {report?.patient.birthDate}
          </Row>
          <Row label="성별" labelEn="Gender">
            {report?.patient.genderDisplayName}
          </Row>
        </Section>

        <Section title="시술 기록" titleEn="Procedure Details">
          <Row label="시술일자" labelEn="Date">
            {report?.procedure.procedureDate}
          </Row>
          <Row label="시술 명칭" labelEn="Procedure">
            <span className="block">{report?.procedure.procedureName}</span>
            <span className="block text-xs leading-[1.375] text-[#7b7a80] uppercase">
              ({report?.procedure.procedureEnglishName})
            </span>
          </Row>
          <Row label="사용 재료" labelEn="Materials">
            {materials.map((material) => (
              <span key={material} className="block">
                {material}
              </span>
            ))}
          </Row>
        </Section>

        <Section title="약물 및 알레르기" titleEn="Medication & Allergies">
          <Row label="처방/복용 약물" labelEn="Medications">
            {medications.map((medication) => (
              <span key={medication} className="block">
                {medication}
              </span>
            ))}
          </Row>
          <Row label="알레르기 반응" labelEn="Allergies">
            {allergies.map((allergy) => (
              <span key={allergy.allergyId} className="block">
                {allergy.allergenDisplayName}
              </span>
            ))}
          </Row>
        </Section>

        <Section title="비상 연락망" titleEn="Emergency Contacts">
          <Row label="시술 병원" labelEn="Clinic Hotline">
            <a href={`tel:${report?.emergencyContacts.clinicPhoneNumber}`}>
              {report?.emergencyContacts.clinicPhoneNumber}
            </a>
          </Row>
          <Row label="보호자" labelEn="Guardian">
            <a href={`tel:${report?.emergencyContacts.guardianPhoneNumber}`}>
              {report?.emergencyContacts.guardianPhoneNumber}
            </a>
          </Row>
        </Section>
      </div>
    </div>
  );
}

export default EmergencyReportPage;
