import { FabricObject } from "fabric";

declare module "fabric" {
  interface Canvas {
    getItemById(name: string): FabricObject | null;
  }

  interface Object {
    object?: FabricObject;
    label?: string;
    color?: string;
    mask?: string;
    id: string;
    defaults: Array<{ name: string; value: any }>;
    defaultLeft?: number;
    defaultTop?: number;
    defaultScaleX?: number;
    defaultScaleY?: number;
    animateDuration?: number;
  }

  interface GroupProps {
    id: string;
    cursorWidth: number;
    cursorDuration: number;
    cursorDelay: number;
    assetType: string;
    strokeDashArray: number[];
    inGroup: boolean;
  }
}
