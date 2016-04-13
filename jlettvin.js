var jlettvin = (function() {
    window.jlettvin = window.jlettvin || {}
    function namespace() {
        for (hierarchy of arguments) {
            var order = hierarchy.split('.');
            var head = window;
            for (name of order) {
                if (typeof head[name] === 'undefined') head[name] = {};
                head = head[name];
            }
        }
    }
})();
