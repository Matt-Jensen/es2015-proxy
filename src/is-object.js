/**
 * @param {*} o
 * @return {boolean} whether this is probably a (non-null) Object
 */
export default function isObject(o) {
  return o ? (typeof o == 'object' || typeof o == 'function') : false;
}
