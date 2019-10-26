// @tensorflow/tfjs-models Copyright 2019 Google
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@tensorflow/tfjs-core')) :
    typeof define === 'function' && define.amd ? define(['exports', '@tensorflow/tfjs-core'], factory) :
    (factory((global.knnClassifier = {}),global.tf));
}(this, (function (exports,tf) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function concatWithNulls(ndarray1, ndarray2) {
        if (ndarray1 == null && ndarray2 == null) {
            return null;
        }
        if (ndarray1 == null) {
            return ndarray2.clone();
        }
        else if (ndarray2 === null) {
            return ndarray1.clone();
        }
        return ndarray1.concat(ndarray2, 0);
    }
    function topK(values, k) {
        var valuesAndIndices = [];
        for (var i = 0; i < values.length; i++) {
            valuesAndIndices.push({ value: values[i], index: i });
        }
        valuesAndIndices.sort(function (a, b) {
            return b.value - a.value;
        });
        var topkValues = new Float32Array(k);
        var topkIndices = new Int32Array(k);
        for (var i = 0; i < k; i++) {
            topkValues[i] = valuesAndIndices[i].value;
            topkIndices[i] = valuesAndIndices[i].index;
        }
        return { values: topkValues, indices: topkIndices };
    }

    var KNNClassifier = (function () {
        function KNNClassifier() {
            this.classDatasetMatrices = {};
            this.classExampleCount = {};
            this.labelToClassId = {};
            this.nextClassId = 0;
        }
        KNNClassifier.prototype.addExample = function (example, label) {
            var _this = this;
            if (this.exampleShape == null) {
                this.exampleShape = example.shape;
            }
            if (!tf.util.arraysEqual(this.exampleShape, example.shape)) {
                throw new Error("Example shape provided, " + example.shape + " does not match " +
                    ("previously provided example shapes " + this.exampleShape + "."));
            }
            this.clearTrainDatasetMatrix();
            if (!(label in this.labelToClassId)) {
                this.labelToClassId[label] = this.nextClassId++;
            }
            tf.tidy(function () {
                var normalizedExample = _this.normalizeVectorToUnitLength(example.flatten());
                var exampleSize = normalizedExample.shape[0];
                if (_this.classDatasetMatrices[label] == null) {
                    _this.classDatasetMatrices[label] =
                        normalizedExample.as2D(1, exampleSize);
                }
                else {
                    var newTrainLogitsMatrix = _this.classDatasetMatrices[label]
                        .as2D(_this.classExampleCount[label], exampleSize)
                        .concat(normalizedExample.as2D(1, exampleSize), 0);
                    _this.classDatasetMatrices[label].dispose();
                    _this.classDatasetMatrices[label] = newTrainLogitsMatrix;
                }
                tf.keep(_this.classDatasetMatrices[label]);
                if (_this.classExampleCount[label] == null) {
                    _this.classExampleCount[label] = 0;
                }
                _this.classExampleCount[label]++;
            });
        };
        KNNClassifier.prototype.similarities = function (input) {
            var _this = this;
            return tf.tidy(function () {
                var normalizedExample = _this.normalizeVectorToUnitLength(input.flatten());
                var exampleSize = normalizedExample.shape[0];
                if (_this.trainDatasetMatrix == null) {
                    var newTrainLogitsMatrix = null;
                    for (var label in _this.classDatasetMatrices) {
                        newTrainLogitsMatrix = concatWithNulls(newTrainLogitsMatrix, _this.classDatasetMatrices[label]);
                    }
                    _this.trainDatasetMatrix = newTrainLogitsMatrix;
                }
                if (_this.trainDatasetMatrix == null) {
                    console.warn('Cannot predict without providing training examples.');
                    return null;
                }
                tf.keep(_this.trainDatasetMatrix);
                var numExamples = _this.getNumExamples();
                return _this.trainDatasetMatrix.as2D(numExamples, exampleSize)
                    .matMul(normalizedExample.as2D(exampleSize, 1))
                    .as1D();
            });
        };
        KNNClassifier.prototype.predictClass = function (input, k) {
            if (k === void 0) { k = 3; }
            return __awaiter(this, void 0, void 0, function () {
                var knn, kVal, topKIndices, _a;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (k < 1) {
                                throw new Error("Please provide a positive integer k value to predictClass.");
                            }
                            if (this.getNumExamples() === 0) {
                                throw new Error("You have not added any examples to the KNN classifier. " +
                                    "Please add examples before calling predictClass.");
                            }
                            knn = tf.tidy(function () { return _this.similarities(input).asType('float32'); });
                            kVal = Math.min(k, this.getNumExamples());
                            _a = topK;
                            return [4, knn.data()];
                        case 1:
                            topKIndices = _a.apply(void 0, [_b.sent(), kVal]).indices;
                            knn.dispose();
                            return [2, this.calculateTopClass(topKIndices, kVal)];
                    }
                });
            });
        };
        KNNClassifier.prototype.clearClass = function (label) {
            if (this.classDatasetMatrices[label] == null) {
                throw new Error("Cannot clear invalid class " + label);
            }
            delete this.classDatasetMatrices[label];
            delete this.classExampleCount[label];
            this.clearTrainDatasetMatrix();
        };
        KNNClassifier.prototype.clearAllClasses = function () {
            for (var label in this.classDatasetMatrices) {
                this.clearClass(label);
            }
        };
        KNNClassifier.prototype.getClassExampleCount = function () {
            return this.classExampleCount;
        };
        KNNClassifier.prototype.getClassifierDataset = function () {
            return this.classDatasetMatrices;
        };
        KNNClassifier.prototype.getNumClasses = function () {
            return Object.keys(this.classExampleCount).length;
        };
        KNNClassifier.prototype.setClassifierDataset = function (classDatasetMatrices) {
            this.clearTrainDatasetMatrix();
            this.classDatasetMatrices = classDatasetMatrices;
            for (var label in classDatasetMatrices) {
                this.classExampleCount[label] = classDatasetMatrices[label].shape[0];
            }
        };
        KNNClassifier.prototype.calculateTopClass = function (topKIndices, kVal) {
            var topLabel;
            var confidences = {};
            if (topKIndices == null) {
                return {
                    classIndex: this.labelToClassId[topLabel],
                    label: topLabel,
                    confidences: confidences
                };
            }
            var classOffsets = {};
            var offset = 0;
            for (var label in this.classDatasetMatrices) {
                offset += this.classExampleCount[label];
                classOffsets[label] = offset;
            }
            var votesPerClass = {};
            for (var label in this.classDatasetMatrices) {
                votesPerClass[label] = 0;
            }
            for (var i = 0; i < topKIndices.length; i++) {
                var index = topKIndices[i];
                for (var label in this.classDatasetMatrices) {
                    if (index < classOffsets[label]) {
                        votesPerClass[label]++;
                        break;
                    }
                }
            }
            var topConfidence = 0;
            for (var label in this.classDatasetMatrices) {
                var probability = votesPerClass[label] / kVal;
                if (probability > topConfidence) {
                    topConfidence = probability;
                    topLabel = label;
                }
                confidences[label] = probability;
            }
            return {
                classIndex: this.labelToClassId[topLabel],
                label: topLabel,
                confidences: confidences
            };
        };
        KNNClassifier.prototype.clearTrainDatasetMatrix = function () {
            if (this.trainDatasetMatrix != null) {
                this.trainDatasetMatrix.dispose();
                this.trainDatasetMatrix = null;
            }
        };
        KNNClassifier.prototype.normalizeVectorToUnitLength = function (vec) {
            return tf.tidy(function () {
                var sqrtSum = vec.norm();
                return tf.div(vec, sqrtSum);
            });
        };
        KNNClassifier.prototype.getNumExamples = function () {
            var total = 0;
            for (var label in this.classDatasetMatrices) {
                total += this.classExampleCount[label];
            }
            return total;
        };
        KNNClassifier.prototype.dispose = function () {
            this.clearTrainDatasetMatrix();
            for (var label in this.classDatasetMatrices) {
                this.classDatasetMatrices[label].dispose();
            }
        };
        return KNNClassifier;
    }());
    function create() {
        return new KNNClassifier();
    }

    exports.KNNClassifier = KNNClassifier;
    exports.create = create;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
