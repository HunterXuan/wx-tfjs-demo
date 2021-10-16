import { estimate } from './estimate';
import {refineEstimate} from './refine-estimate';

export class Estimator {
  projectionTransform: any;

  constructor(projectionTransform: any) {
    this.projectionTransform = projectionTransform;
  }

  // Solve homography between screen points and world points using Direct Linear Transformation
  // then decompose homography into rotation and translation matrix (i.e. modelViewTransform)
  estimate({
    screenCoords,
    worldCoords
  }: {
    screenCoords: {x: number, y: number}[],
    worldCoords: {x: number, y: number}[]
  }) {
    const modelViewTransform = estimate({screenCoords, worldCoords, projectionTransform: this.projectionTransform});
    return modelViewTransform;
  }

  refineEstimate({
    initialModelViewTransform,
    worldCoords,
    screenCoords
  }:{
    initialModelViewTransform: any,
    worldCoords: any,
    screenCoords: any
  }) {
    const updatedModelViewTransform = refineEstimate({initialModelViewTransform, worldCoords, screenCoords, projectionTransform: this.projectionTransform});
    return updatedModelViewTransform;
  }
}
