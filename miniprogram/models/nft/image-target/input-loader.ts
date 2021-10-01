import * as tf from '@tensorflow/tfjs-core';

// More efficient implementation for tf.browser.fromPixels
//   original implementation: /node_modules/@tensorflow/tfjs-backend-webgl/src/kernels/FromPixels.ts
// 
// This implementation return grey scale instead of RGBA in the orignal implementation 

export class InputLoader {
  width: number;
  height: number;
  texShape: number[];
  context: CanvasRenderingContext2D | null;
  program: { variableNames: string[]; outputShape: number[]; userCode: string; };
  tempPixelHandle: any;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.texShape = [height, width];

    const context = document.createElement('canvas').getContext('2d');
    context.canvas.width = width;
    context.canvas.height = height;
    this.context = context;

    this.program = this.buildProgram(width, height);

    const backend = tf.backend();
    this.tempPixelHandle = backend.makeTensorInfo(this.texShape, 'int32');
    // warning!!!
    // usage type should be TextureUsage.PIXELS, but tfjs didn't export this enum type, so we hard-coded 2 here 
    //   i.e. backend.texData.get(tempPixelHandle.dataId).usage = TextureUsage.PIXELS;
    backend.texData.get(this.tempPixelHandle.dataId).usage = 2;
  }

  // input is instance of HTMLVideoElement or HTMLImageElement
  loadInput(input) {
    if (input.width && input.height && input.data) {
      return tf.browser.fromPixels({
        data: new Uint8Array(input.data),
        width: input.width,
        height: input.height,
      }, 4);
    }
    this.context.drawImage(input, 0, 0, this.width, this.height);

    const backend = tf.backend();
    backend.gpgpu.uploadPixelDataToTexture(backend.getTexture(this.tempPixelHandle.dataId), this.context.canvas);

    //const res = backend.compileAndRun(this.program, [this.tempPixelHandle], 'float32');
    const res = this._compileAndRun(this.program, [this.tempPixelHandle], 'float32');
    //backend.disposeData(tempPixelHandle.dataId);
    return res;
  }

  buildProgram(width: number, height: number) {
    const textureMethod = tf.env().getNumber('WEBGL_VERSION') === 2? 'texture': 'texture2D';
    const program = {
      variableNames: ['A'],
      outputShape: this.texShape,
      userCode:`
	void main() {
	  ivec2 coords = getOutputCoords();
	  int texR = coords[0];
	  int texC = coords[1];
	  vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${width}.0, ${height}.0);

	  vec4 values = ${textureMethod}(A, uv);
	  setOutput((values.r + values.g + values.b) * 255.0 / 3.0);
	}
      `
    }
    return program;
  }

  _compileAndRun(program, inputs) {
    const outInfo = tf.backend().compileAndRun(program, inputs);
    return tf.engine().makeTensorFromDataId(outInfo.dataId, outInfo.shape, outInfo.dtype);
  }
}