import ellipse441 from "@/assets/home/glow-ellipse-441.svg";
import ellipse444 from "@/assets/home/glow-ellipse-444.svg";
import gradientBottom from "@/assets/home/home-gradient-bottom.png";
import gradientTop from "@/assets/shared/home-gradient-top.png";

const STATUS_BAR_HEIGHT = 60;

interface GlowEllipse {
  id: string;
  src: string;
  width: number;
  height: number;
  centerY: number;
  rotate?: boolean;
}

/*
 * Figma 210:1532의 레이어 순서를 그대로 따른다.
 * SVG 크기에는 Gaussian blur 여백이 이미 포함되어 있다.
 * 441/444는 원본 SVG가 세로형이므로 Figma처럼 90도 회전한다.
 */
const ELLIPSES: GlowEllipse[] = [
  {
    id: "purple-wide",
    src: ellipse441,
    width: 461,
    height: 622,
    centerY: 420.5,
    rotate: true,
  },
  {
    id: "purple-core",
    src: ellipse444,
    width: 351,
    height: 360,
    centerY: 420.5,
    rotate: true,
  },
  {
    id: "gradient-bottom",
    src: gradientBottom,
    width: 650,
    height: 650,
    centerY: 674,
  },
  {
    id: "gradient-top",
    src: gradientTop,
    width: 650,
    height: 650,
    centerY: 183,
  },
];

function HomeBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#FDFBFF]"
    >
      {ELLIPSES.map(({ id, src, width, height, centerY, rotate }) => (
        <img
          key={id}
          src={src}
          alt=""
          className="absolute left-1/2 max-w-none"
          style={{
            top: centerY - height / 2 - STATUS_BAR_HEIGHT,
            width,
            height,
            transform: `translateX(-50%)${rotate ? " rotate(90deg)" : ""}`,
          }}
        />
      ))}
    </div>
  );
}

export default HomeBackdrop;
