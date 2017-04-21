export default (() => {
    if (
        typeof document === 'undefined' || // for serverside rendering
        typeof document.documentElement.style === 'string') {
        return 'transform';
    }
    return 'WebkitTransform';
})();
