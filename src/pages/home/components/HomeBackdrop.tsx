import ellipse441 from "@/assets/home/glow-ellipse-441.svg";
import ellipse444 from "@/assets/home/glow-ellipse-444.svg";
import {
  HOME_GRADIENT_BOTTOM,
  HOME_GRADIENT_TOP,
} from "@/constants/backdropGradient";

const STATUS_BAR_HEIGHT = 60;

interface BackdropLayer {
  id: string;
  width: number;
  height: number;
  centerY: number;
  rotate?: boolean;
  /* SVG 글로우는 이미지로, 방사형 그라데이션은 CSS 배경으로 그린다 */
  src?: string;
  background?: string;
}

/*
 * Figma 210:1532의 레이어 순서를 그대로 따른다.
 * SVG 크기에는 Gaussian blur 여백이 이미 포함되어 있다.
 * 441/444는 원본 SVG가 세로형이므로 Figma처럼 90도 회전한다.
 *
 * gradient-bottom / gradient-top은 원래 1300x1300 PNG였다.
 * 단순한 방사형 글로우인데 알파 채널 때문에 각각 300kB가 넘어,
 * 원본 픽셀에서 뽑은 값으로 radial-gradient를 만들어 대체했다.
 * (docs/performance/04-background-images.md 참고)
 */
const LAYERS: BackdropLayer[] = [
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
    background: HOME_GRADIENT_BOTTOM,
    width: 650,
    height: 650,
    centerY: 674,
  },
  {
    id: "gradient-top",
    background: HOME_GRADIENT_TOP,
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
      {LAYERS.map(({ id, src, background, width, height, centerY, rotate }) => {
        const style = {
          top: centerY - height / 2 - STATUS_BAR_HEIGHT,
          width,
          height,
          transform: `translateX(-50%)${rotate ? " rotate(90deg)" : ""}`,
        };

        return src ? (
          <img
            key={id}
            src={src}
            alt=""
            className="absolute left-1/2 max-w-none"
            style={style}
          />
        ) : (
          <div
            key={id}
            className="absolute left-1/2 max-w-none"
            style={{ ...style, background }}
          />
        );
      })}
    </div>
  );
}

export default HomeBackdrop;
