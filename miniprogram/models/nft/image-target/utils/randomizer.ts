const mRandSeed = 1234;

export const createRandomizer = () => {
  const randomizer = {
    seed: mRandSeed,

    arrayShuffle(options: { arr: any; sampleSize: any; }) {
      const {arr, sampleSize} = options;
      for (let i = 0; i < sampleSize; i++) {

        this.seed = (214013 * this.seed + 2531011) % (1 << 31);
        let k = (this.seed >> 16) & 0x7fff;
        k = k % arr.length;

        let tmp = arr[i];
        arr[i] = arr[k];
        arr[k] = tmp;
      }
    },

    nextInt(maxValue: number) {
      this.seed = (214013 * this.seed + 2531011) % (1 << 31);
      let k = (this.seed >> 16) & 0x7fff;
      k = k % maxValue;
      return k;
    }
  }
  return randomizer;
}
