export function partial(f) {
  const args = Array.prototype.slice.call(arguments, 1);
  return function() {
    return f.apply(null, args.concat(Array.prototype.slice.call(arguments, 0)));
  };
}