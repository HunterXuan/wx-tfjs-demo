import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
import alias from '@rollup/plugin-alias';
import multiInput from 'rollup-plugin-multi-input';
const chokidar = require('chokidar');

const p = s => path.resolve(__dirname, s);
const useCustom = process.argv.includes('--custom');
const isDev = process.argv.includes('-w') || process.argv.includes('--watch');

function codeTransform() {
  return {
    transform(code, file) {
      // 注入环境变量
      code = code.replace(`import.meta.CUSTOM`, `${useCustom}`);

      // 改为国内地址
      code = code
        .replace(/fromTFHub:/g, 'fromTFHub_:')
        .replace(
          /https:\/\/tfhub.dev\/mediapipe\/tfjs-model\/handdetector\/1\/default\/1/g,
          'https://ai.flypot.cn/proxy/tfjs-models/tfhub-tfjs-modules/mediapipe/tfjs-model/handdetector/1/default/1/model.json'
        )
        .replace(
          /https:\/\/tfhub.dev\/mediapipe\/tfjs-model\/handskeleton\/1\/default\/1\/anchors.json\?tfjs-format=file/g,
          'https://ai.flypot.cn/proxy/tfjs-models/tfhub-tfjs-modules/mediapipe/tfjs-model/handskeleton/1/default/1/anchors.json',
        )
        .replace(
          /https:\/\/tfhub.dev\/mediapipe\/tfjs-model\/handskeleton\/1\/default\/1/g,
          'https://ai.flypot.cn/proxy/tfjs-models/tfhub-tfjs-modules/mediapipe/tfjs-model/handskeleton/1/default/1/model.json',
        )
        .replace(
          /https:\/\/tfhub.dev\/mediapipe\/tfjs-model\/facemesh\/1\/default\/1/g,
          'https://ai.flypot.cn/proxy/tfjs-models/tfhub-tfjs-modules/mediapipe/tfjs-model/facemesh/1/default/1/model.json',
        )
        .replace(
          /https:\/\/tfhub.dev\/mediapipe\/tfjs-model\/iris\/1\/default\/2/g,
          'https://ai.flypot.cn/proxy/tfjs-models/tfhub-tfjs-modules/mediapipe/tfjs-model/iris/1/default/2/model.json',
        )
        .replace(
          /https:\/\/tfhub.dev\/tensorflow\/tfjs-model\/blazeface\/1\/default\/1/g,
          'https://www.gstaticcnapps.cn/tfhub-tfjs-modules/tensorflow/tfjs-model/blazeface/1/default/1/model.json'
        )
        .replace(
          /https:\/\/tfhub.dev\/google\/imagenet\/mobilenet_v1_025_224\/classification\/1/g,
          'https://www.gstaticcnapps.cn/tfhub-tfjs-modules/google/imagenet/mobilenet_v1_025_224/classification/1/model.json'
        )
        .replace(
          /https:\/\/storage.googleapis.com\//g,
          'https://www.gstaticcnapps.cn/'
        );

      // body-pix
      code = code.replace(/function getInputSize\(e\){/g, 'function getInputSize(e){return [e.shape[0], e.shape[1]];')
      
      return { code };
    },
  };
}

const aliasPlugin = useCustom
  ? alias({
    entries: [
      {
        find: /@tensorflow\/tfjs$/,
        replacement: p('./custom_tfjs/custom_tfjs.js'),
      },
      {
        find: /@tensorflow\/tfjs-core$/,
        replacement: p('./custom_tfjs/custom_tfjs_core.js'),
      },
      {
        find: '@tensorflow/tfjs-core/dist/ops/ops_for_converter',
        replacement: p('./custom_tfjs/custom_ops_for_converter.js'),
      },
    ],
  })
  : null;

export default [
  {
    input: [
      'miniprogram/**/*.ts',
    ],
    treeshake: true,
    output: {
      format: 'cjs',
      dir: 'miniprogram/',
      chunkFileNames: 'chunks/[name].js',
      entryFileNames: (chunkInfo) => {
        return chunkInfo.facadeModuleId.replace(p('./miniprogram'), '').replace('.ts', '.js').substring(1);
      },
    },
    plugins: [
      multiInput(),
      codeTransform(),
      aliasPlugin,
      builtins(),
      resolve({
        extensions: ['.ts', '.js'],
        preferBuiltins: false,
        mainFields: ['jsnext:main', 'jsnext', 'module', 'main'],
      }),
      commonjs({ include: ['node_modules/**'] }),
      esbuild({
        sourceMap: false,
        minify: !isDev,
        target: 'es2018',
        legalComments: 'none',
      }),
      terser({
        output: { comments: false },
        mangle: !isDev,
        compress: !isDev,
      }),
    ],
    watch: {
      chokidar: true,
      clearScreen: true
    }
  },
];