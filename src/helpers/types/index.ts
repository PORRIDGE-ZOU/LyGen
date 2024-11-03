export type PKeyframe = {
  start: number;
  end: number;
  trimstart: number;
  trimend: number;
  object: Object;
  id: string;
};

export interface AnimationProps {
  duration: number;
  order: "forward" | "backward";
  typeAnim: string;
  preset: string;
  easing: string;
  fill?: string;
  fontFamily?: string;
  left?: number;
  top?: number;
  scaleX?: number;
  scaleY?: number;
}
