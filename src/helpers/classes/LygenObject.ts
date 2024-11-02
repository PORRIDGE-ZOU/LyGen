import { FabricObject } from "fabric";

export class LygenObject extends FabricObject {
  object?: FabricObject;
  label?: string;
  color?: string;
  mask?: string;
  id: string;
  defaults: Array<{ name: string; value: any }>;
  locked?: any;
  start?: number;
  end?: number;
  animateDuration?: number;

  constructor(
    id: string,
    object?: FabricObject,
    label?: string,
    color?: string,
    mask?: string,
    defaults?: Array<{ name: string; value: any }>,
    locked?: any,
    start?: number,
    end?: number
  ) {
    super();
    this.id = id;
    this.object = object;
    this.label = label;
    this.color = color;
    this.mask = mask;
    this.defaults = defaults || [];
    this.locked = locked;
    this.start = start;
    this.end = end;
    if (object && object.animateDuration) {
      this.animateDuration = object.animateDuration;
    }
  }
}
